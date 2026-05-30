import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Camera, 
  Sparkles,
  Info,
  Globe,
  LayoutDashboard,
  Calendar,
  Activity,
  LogOut,
  Sliders,
  Droplet,
  Award,
  TrendingUp,
  Settings as SettingsIcon,
  ThumbsUp,
  ThumbsDown,
  Moon,
  Sun,
  FileText,
  Eye,
  EyeOff,
  HeartPulse,
  Check
} from 'lucide-react';

import { supabase } from './supabaseClient';

const API_BASE = 'https://vitascan-cwwx.onrender.com/api';

import enDict from './locales/en.json';
import hiDict from './locales/hi.json';
import teDict from './locales/te.json';
import taDict from './locales/ta.json';

const dictionaries = {
  en: enDict,
  hi: hiDict,
  te: teDict,
  ta: taDict
};

const PEXELS_CACHE = {};

const normalizeMealName = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
};

const fetchPexelsImage = async (query) => {
  if (!query) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&auto=format&fit=crop";
  const normalizedKey = normalizeMealName(query);
  
  console.log(`\nCACHE LOOKUP:\n${normalizedKey}`);
  
  // 1. Check in-memory fast cache first
  if (PEXELS_CACHE[normalizedKey]) {
    console.log(`CACHE RESULT:\nfound (Memory)`);
    return { url: PEXELS_CACHE[normalizedKey], isCached: true };
  }

  try {
    // 2. Check Database Cache
    const { data: cachedDb, error: dbError } = await supabase
      .from('meal_images')
      .select('image_url')
      .eq('meal_name', normalizedKey)
      .maybeSingle();

    if (cachedDb?.image_url) {
      console.log(`CACHE RESULT:\nfound (Supabase)`);
      console.log(`Cache Hit [DB]: Using cached image for "${query}" (${normalizedKey})`);
      PEXELS_CACHE[normalizedKey] = cachedDb.image_url;
      // Asynchronously update last_used_at without awaiting
      supabase.from('meal_images').update({ last_used_at: new Date().toISOString() }).eq('meal_name', normalizedKey).then();
      return { url: cachedDb.image_url, isCached: true };
    } else {
      console.log(`CACHE RESULT:\nnot found`);
    }

    // 3. Cache Miss - Fetch from Pexels
    console.log(`Cache Miss: Fetching image from Pexels for "${query}" (${normalizedKey})`);
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " food")}&per_page=1`, {
      headers: { Authorization: '2mbFkT5AagijI9pomyLpWNYM5aIKxmJNhSmYrAF5KMXNKwV9f8zRVPyl' }
    });
    const data = await res.json();
    
    if (data.photos && data.photos.length > 0) {
      const url = data.photos[0].src.large || data.photos[0].src.medium;
      PEXELS_CACHE[normalizedKey] = url;
      
      // Save to database cache asynchronously and verify result
      supabase.from('meal_images').insert([{
        meal_name: normalizedKey,
        image_url: url
      }]).then(({ error }) => {
        console.log(`Saving to cache: ${normalizedKey}`);
        console.log(`Image URL: ${url}`);
        if (error) {
           console.error(`Save result: FAILED`, error);
        } else {
           console.log(`Save result: SUCCESS`);
        }
      });
      
      return { url, isCached: false };
    }
  } catch (err) {
    console.error("Pexels / DB Cache error:", err);
  }
  // Fallback placeholder (not cached in DB to allow future retry)
  return { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&auto=format&fit=crop", isCached: false };
};

const calculateMetabolicTargets = (profile) => {
  const bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 78;
  let mult = profile.activity === 'Sedentary' ? 1.2 : profile.activity === 'Active' ? 1.55 : 1.35;
  let tdee = bmr * mult;

  let dailyTarget = tdee;
  if (profile.goal === 'Lose Weight') dailyTarget -= 500;
  else if (profile.goal === 'Gain Weight') dailyTarget += 400;
  else if (profile.goal === 'Manage Health Issue') dailyTarget -= 100;

  if (profile.conditions.includes('Obesity')) dailyTarget -= 200;
  if (profile.conditions.includes('Underweight')) dailyTarget = Math.max(dailyTarget, tdee + 300);
  if (profile.conditions.includes('Pregnancy')) dailyTarget += 300;
  dailyTarget = Math.max(1200, Math.round(dailyTarget));

  let pPct = 0.30; let cPct = 0.40; let fPct = 0.30;
  if (profile.conditions.includes('Diabetes') || profile.conditions.includes('PCOS') || profile.conditions.includes('Fatty Liver')) {
    cPct = 0.30; pPct = 0.35; fPct = 0.35;
  }
  if (profile.conditions.includes('Kidney Disease')) {
    pPct = 0.15; cPct = 0.55; fPct = 0.30;
  }
  if (profile.goal === 'Gain Weight') {
    pPct = 0.35; cPct = 0.45; fPct = 0.20;
  }
  if (profile.conditions.includes('Hypertension') || profile.conditions.includes('High Cholesterol')) {
    fPct = 0.25; cPct = 0.45; pPct = 0.30;
  }

  const proteinTarget = Math.round((dailyTarget * pPct) / 4);
  const carbTarget = Math.round((dailyTarget * cPct) / 4);
  const fatTarget = Math.round((dailyTarget * fPct) / 9);

  let waterLiters = profile.weight * 0.035;
  if (profile.activity === 'Active' || profile.activity === 'Moderate') waterLiters += 0.5;
  const waterTarget = parseFloat(waterLiters.toFixed(1));

  return { dailyTarget, proteinTarget, carbTarget, fatTarget, waterTarget };
};

export default function App() {
  const [appState, setAppState] = useState('splash');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [user, setUser] = useState(null);
  const [meals, setMeals] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [waterLiters, setWaterLiters] = useState(0.0);
  const [apiKey, setApiKey] = useState('AQ.Ab8RN6L-H0r2GT-GLCmYr9kSfmw75aKPsMBJZdHC7XPfwuqvsA');
  
  // Modals & Popups
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('Breakfast');
  const [manualMeal, setManualMeal] = useState({ name: '', emoji: '🍛', calories: '', protein: '', carbs: '', fat: '' });
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [customWater, setCustomWater] = useState('');
  const [showCoachModal, setShowCoachModal] = useState(false);

  // Normalize user settings between DB snake_case and UI camelCase
  const normalizeUser = (dbUser) => {
    if (!dbUser) return null;
    return {
      ...dbUser,
      targetWeight: dbUser.target_weight !== undefined ? dbUser.target_weight : dbUser.targetWeight,
      activityLevel: dbUser.activity_level !== undefined ? dbUser.activity_level : dbUser.activityLevel,
      preferredLanguage: dbUser.preferred_language !== undefined ? dbUser.preferred_language : dbUser.preferredLanguage,
      dailyCalorieTarget: dbUser.daily_calorie_target !== undefined ? dbUser.daily_calorie_target : dbUser.dailyCalorieTarget,
      proteinTarget: dbUser.protein_target !== undefined ? dbUser.protein_target : dbUser.proteinTarget,
      carbTarget: dbUser.carb_target !== undefined ? dbUser.carb_target : dbUser.carbTarget,
      fatTarget: dbUser.fat_target !== undefined ? dbUser.fat_target : dbUser.fatTarget,
      waterTarget: dbUser.water_target !== undefined ? dbUser.water_target : dbUser.waterTarget,
      dietPreference: dbUser.diet_preference !== undefined ? dbUser.diet_preference : dbUser.dietPreference,
      isDarkMode: dbUser.is_dark_mode !== undefined ? dbUser.is_dark_mode : dbUser.isDarkMode
    };
  };

  // Forms
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', isSignup: false });
  const [onboarding, setOnboarding] = useState({ goal: 'Lose Weight', conditions: [], allergies: '', name: '', age: 25, height: 170, weight: 70, targetWeight: 65, activity: 'Moderate', dietPreference: 'Balanced' });
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authStatusMsg, setAuthStatusMsg] = useState({ type: '', text: '' }); // type: 'error' | 'success'
  const [profileStatusMsg, setProfileStatusMsg] = useState({ type: '', text: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Scanner States
  const [scanInput, setScanInput] = useState('');
  const [scanTab, setScanTab] = useState('camera');
  const [scanImage, setScanImage] = useState(null);
  const [scanImagePreview, setScanImagePreview] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle');
  const [scanResult, setScanResult] = useState(null);

  // Plan States
  const [planStatus, setPlanStatus] = useState('idle');
  const [dietPlan, setDietPlan] = useState(null);

  const activeLang = (user?.preferredLanguage || localStorage.getItem('vitascan_lang') || 'en').toLowerCase();
  const currentLanguageName = { en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil' }[activeLang] || 'English';
  
  const t = new Proxy({}, {
    get: (target, prop) => {
      if (prop === '$$typeof') return undefined; // React internal compatibility
      return dictionaries[activeLang]?.[prop] || dictionaries['en']?.[prop] || prop;
    }
  });

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchConfig();
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAppState('login');
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update DOM class when theme switches
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch profile
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (error) {
          console.error("Failed to fetch profile:", error);
          setUser({ id: session.user.id, email: session.user.email });
          setAppState('onboarding');
          return;
        }
        if (profile) {
          const normalized = normalizeUser(profile);
          setUser(normalized);
          setIsDarkMode(!!normalized.isDarkMode);
          if (profile.age) {
            setAppState('main_tabs');
          } else {
            setOnboarding(prev => ({ ...prev, name: profile.name || '' }));
            setAppState('onboarding');
          }
        } else {
          setUser({ id: session.user.id, email: session.user.email });
          setAppState('onboarding');
        }
      } else {
        setAppState('login');
      }
    } catch (e) {
      console.error("checkSession failed:", e);
      setAppState('login');
    }
  };

  const toggleDarkMode = async () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    
    if (user) {
      setUser(prev => prev ? { ...prev, isDarkMode: nextVal } : null);
    }
    
    try {
      if (user?.id) {
        const { error } = await supabase.from('profiles').update({ is_dark_mode: nextVal }).eq('id', user.id);
        if (error) console.error("Could not sync theme preference to backend:", error);
      }
    } catch (e) {
      console.error("Could not sync theme preference to backend:", e);
    }
  };

  const fetchUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (error) throw error;
      if (data) {
        const normalized = normalizeUser(data);
        setUser(normalized);
        setOnboarding({
          goal: normalized.goal || 'Lose Weight',
          conditions: normalized.health_conditions ? normalized.health_conditions.split(',') : [],
          name: normalized.name || '',
          age: normalized.age || 25,
          height: normalized.height || 170,
          weight: normalized.weight || 70,
          targetWeight: normalized.targetWeight || 65,
          activity: normalized.activityLevel || 'Moderate',
          dietPreference: normalized.dietPreference || 'Balanced'
        });
      }
    } catch (e) {
      console.error("fetchUser failed:", e);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/config`);
      const data = await res.json();
      if (data.GEMINI_API_KEY) setApiKey(data.GEMINI_API_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      console.log(`\nFETCHING MEALS FOR USER:\n${session.user.id}`);
      
      const { data, error } = await supabase.from('meals').select('*').eq('user_id', session.user.id);
      if (error) throw error;
      
      console.log(`MEALS RETURNED: ${data ? data.length : 0}`);
      if (data && data.length > 0) {
        console.log(`First meal fetched:`, data[0]);
      }
      
      if (data) {
        console.log(`SETTING MEALS STATE: ${data.length}`);
        setMeals(data);
      }
    } catch (e) {
      console.error("fetchMeals failed:", e);
    }
  };

  const fetchWeightRecords = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase.from('weight_records').select('*').eq('user_id', session.user.id);
      if (error) throw error;
      if (data) {
        let sorted = [...data].sort((a, b) => a.timestamp - b.timestamp); // Sort ascending (oldest first)
        
        // Remove adjacent duplicates
        const toDelete = [];
        const cleanRecords = [];
        let lastSeenWeight = null;
        
        sorted.forEach(record => {
          if (record.weight === lastSeenWeight) {
             toDelete.push(record.id);
          } else {
             cleanRecords.push(record);
             lastSeenWeight = record.weight;
          }
        });
        
        if (toDelete.length > 0) {
           console.log(`Cleaning up ${toDelete.length} redundant weight records`);
           // Delete duplicates asynchronously
           supabase.from('weight_records').delete().in('id', toDelete).then();
        }
        
        // Sort back to descending for UI state
        cleanRecords.sort((a, b) => b.timestamp - a.timestamp);
        setWeightRecords(cleanRecords);
      }
    } catch (e) {
      console.error("fetchWeightRecords failed:", e);
    }
  };

  const fetchWaterLog = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const dateStr = getTodayDateStr();
      const { data, error } = await supabase.from('water_logs').select('*').eq('user_id', session.user.id).eq('date_str', dateStr).maybeSingle();
      if (error) throw error;
      setWaterLiters(data ? data.amount : 0);
    } catch (e) {
      console.error("fetchWaterLog failed:", e);
    }
  };

  useEffect(() => {
    if (appState === 'main_tabs') {
      fetchMeals();
      fetchWeightRecords();
      fetchWaterLog();
    }
  }, [appState]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthStatusMsg({ type: '', text: '' });
    try {
      if (authForm.isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
        });
        if (error) {
          setAuthStatusMsg({ type: 'error', text: error.message });
          setIsAuthLoading(false);
          return;
        }
        
        if (data.user) {
          const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', data.user.id).maybeSingle();
          let profileErr;
          if (existingProfile) {
            const { error } = await supabase.from('profiles').update({ name: authForm.name || 'User', email: authForm.email }).eq('id', data.user.id);
            profileErr = error;
          } else {
            const { error } = await supabase.from('profiles').insert([{ id: data.user.id, name: authForm.name || 'User', email: authForm.email }]);
            profileErr = error;
          }
          
          if (profileErr) {
            console.error('Profile Creation Error: ' + profileErr.message);
          }

          // Clear previous states to get a fresh start!
          setMeals([]);
          setWeightRecords([]);
          setWaterLiters(1.8);
          setDietPlan(null);

          // Pre-fill the name field in onboarding
          setOnboarding(prev => ({ ...prev, name: authForm.name || 'User' }));

          setUser(normalizeUser({ id: data.user.id, name: authForm.name || 'User', email: authForm.email }));
          setAuthStatusMsg({ type: 'success', text: 'Account created! Redirecting to setup...' });
          setTimeout(() => {
            setAppState('onboarding');
            setOnboardingStep(1);
            setIsAuthLoading(false);
          }, 1000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        if (error) {
          setAuthStatusMsg({ type: 'error', text: error.message });
          setIsAuthLoading(false);
          return;
        }
        
        if (data.user) {
          // Clear previous states to get a fresh start!
          setMeals([]);
          setWeightRecords([]);
          setWaterLiters(1.8);
          setDietPlan(null);

          let profile = null;
          try {
            const { data: fetchedProfile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
            profile = fetchedProfile;
            if (!profile) {
              const defaultProfile = { id: data.user.id, name: 'User', email: data.user.email };
              await supabase.from('profiles').insert([defaultProfile]);
              profile = defaultProfile;
            }
          } catch (profileErr) {
            console.error("Profile fetch/upsert failed:", profileErr);
            profile = { id: data.user.id, name: 'User', email: data.user.email };
          }

          const normalized = normalizeUser(profile);
          setUser(normalized);
          setAuthStatusMsg({ type: 'success', text: 'Access granted! Logging you in...' });
          
          setTimeout(() => {
            setAppState('main_tabs');
            setIsAuthLoading(false);
          }, 1000);
        }
      }
    } catch (err) {
      console.error(err);
      setAuthStatusMsg({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
      setIsAuthLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    const targets = calculateMetabolicTargets(onboarding);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const profileData = {
        name: onboarding.name, 
        age: onboarding.age, 
        height: onboarding.height, 
        weight: onboarding.weight,
        target_weight: onboarding.targetWeight, 
        goal: onboarding.goal, 
        activity_level: onboarding.activity,
        health_conditions: onboarding.conditions.join(','), 
        daily_calorie_target: targets.dailyTarget,
        protein_target: targets.proteinTarget,
        carb_target: targets.carbTarget,
        fat_target: targets.fatTarget,
        water_target: targets.waterTarget,
        allergies: onboarding.allergies || '',
        diet_preference: onboarding.dietPreference || 'Balanced'
      };

      const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
      let data, error;
      if (existingProfile) {
        ({ data, error } = await supabase.from('profiles').update(profileData).eq('id', session.user.id).select().single());
      } else {
        ({ data, error } = await supabase.from('profiles').insert({ id: session.user.id, ...profileData }).select().single());
      }

      if (error) {
        if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('violates')) {
          alert("Unable to save profile. Please sign in again and try.");
        } else {
          alert("Error saving onboarding details: " + error.message);
        }
        return;
      }
      
      if (data) {
        setUser(normalizeUser(data));
      }
      
      const lastRecord = weightRecords.length > 0 ? weightRecords[0] : null;
      if (!lastRecord || lastRecord.weight !== onboarding.weight) {
        await supabase.from('weight_records').insert([
          { user_id: session.user.id, weight: onboarding.weight, timestamp: Date.now() }
        ]);
      }

      setActiveTab('dashboard');
      setDietPlan(null);
      handleGenerateDietPlan(true);
      fetchWeightRecords();
      setAppState('main_tabs');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear all state values and localStorage on logout for a complete fresh start!
      setMeals([]);
      setWeightRecords([]);
      setWaterLiters(1.8);
      setDietPlan(null);
      localStorage.clear();
      setUser(null);
      setAppState('login');
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
    }
  };


  const updateWater = async (delta) => {
    const nextVal = Math.max(0, Math.min(6, parseFloat((waterLiters + delta).toFixed(2))));
    setWaterLiters(nextVal);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const dateStr = getTodayDateStr();
      
      const { data: existing } = await supabase.from('water_logs').select('id').eq('user_id', session.user.id).eq('date_str', dateStr).maybeSingle();
      if (existing) {
        await supabase.from('water_logs').update({ amount: nextVal }).eq('id', existing.id);
      } else {
        await supabase.from('water_logs').insert([{ user_id: session.user.id, date_str: dateStr, amount: nextVal }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddManualMeal = async (e) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      console.log(`\nSELECTED MEAL TYPE:\n${selectedMealType.toLowerCase()}`);
      const insertPayload = {
        user_id: session.user.id,
        meal_type: selectedMealType.toLowerCase(),
        food_name: manualMeal.name,
        calories: parseInt(manualMeal.calories || 300),
        protein: parseFloat(manualMeal.protein || 10),
        carbs: parseFloat(manualMeal.carbs || 30),
        fat: parseFloat(manualMeal.fat || 8),
        timestamp: Date.now()
      };
      console.log('INSERT PAYLOAD:', insertPayload);

      const { error } = await supabase.from('meals').insert([insertPayload]);
      if (error) console.error("Error inserting manual meal:", error);
      
      setShowAddMealModal(false);
      setManualMeal({ name: '', emoji: '🍛', calories: '', protein: '', carbs: '', fat: '' });
      fetchMeals();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMeal = async (id) => {
    try {
      await supabase.from('meals').delete().eq('id', id);
      fetchMeals();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddWeight = async (wt) => {
    if (!wt) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const val = parseFloat(wt);
      await supabase.from('weight_records').insert([
        { user_id: session.user.id, weight: val, timestamp: Date.now() }
      ]);
      const { data: updatedProfile } = await supabase.from('profiles').update({ weight: val }).eq('id', session.user.id).select().single();
      if (updatedProfile) {
        setUser(normalizeUser(updatedProfile));
      }
      
      fetchWeightRecords();
      fetchUser();
    } catch (e) {
      console.error(e);
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
      if ((encoded.length % 4) > 0) encoded += '='.repeat(4 - (encoded.length % 4));
      resolve(encoded);
    };
    reader.onerror = error => reject(error);
  });



  const handleScanFood = async () => {
    if (scanTab === 'camera' && !scanImage) {
      alert("Please upload a food photo before analyzing.");
      return;
    }
    if (scanTab === 'text' && !scanInput.trim()) {
      alert("Please enter a food description before analyzing.");
      return;
    }

    setScanStatus('loading');
    setScanResult(null);

    try {
      const userGoal = onboarding.goal;
      const userConditions = onboarding.conditions.join(', ') || 'None';
      
      const systemInstruction = `
        You are VitaScan, an elite AI nutrition coach. Analyze the food item requested.
        Provide a complete nutritional assessment. 
        Tailor the 'healthScore' (1 to 10 scale) and 'advice' specifically to the user's profile:
        - User Goal: ${userGoal}
        - User Conditions: ${userConditions}
        
        Crucially, assess your confidence in identifying the food. Provide a 'confidence' score between 0.0 and 1.0. 
        If confidence is below 0.7, provide up to 3 alternative 'possibleMatches' strings.
        
        You must return only a clean, well-formed raw JSON block. No markdown syntax, No backticks. Here is the response format:
        {
          "foodName": "Food Name",
          "emoji": "emoji",
          "calories": 250,
          "protein": 8.0,
          "carbs": 32.5,
          "fat": 10.0,
          "healthScore": 7,
          "pros": ["Pro point 1", "Pro point 2"],
          "cons": ["Con point 1", "Con point 2"],
          "ingredients": ["ingredient 1", "ingredient 2"],
          "advice": "Personalized health coach text under 100 words targeting user issues.",
          "confidence": 0.95,
          "possibleMatches": []
        }
        
        CRITICAL INSTRUCTION: You MUST generate your ENTIRE response (foodName, pros, cons, ingredients, advice, etc.) exclusively in the ${currentLanguageName} language.
      `;

      let parts = [];
      
      if (scanTab === 'camera' && scanImage) {
        parts.push({ text: "Analyze this food photograph." });
        const base64Data = await fileToBase64(scanImage);
        parts.push({
          inlineData: { mimeType: scanImage.type, data: base64Data }
        });
      } else if (scanTab === 'text' && scanInput.trim()) {
        parts.push({ text: `Analyze the meal: ${scanInput}` });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      });

      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        let clean = rawText.trim();
        if (clean.startsWith("```json")) clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(clean);
        parsed.isRealAI = true;
        setScanResult(parsed);
        setScanStatus('success');
      } else {
        throw new Error("No response from AI");
      }
    } catch (err) {
      alert("AI Analysis Error: " + err.message);
      setScanStatus('idle');
    }
  };

  const logScannedMeal = async (type) => {
    if (!scanResult) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      console.log(`\nSELECTED MEAL TYPE:\n${type.toLowerCase()}`);
      const insertPayload = {
        user_id: session.user.id,
        meal_type: type.toLowerCase(),
        food_name: scanResult.foodName,
        calories: scanResult.calories,
        protein: scanResult.protein,
        carbs: scanResult.carbs,
        fat: scanResult.fat,
        health_score: scanResult.healthScore,
        timestamp: Date.now()
      };
      console.log('INSERT PAYLOAD:', insertPayload);

      const { error } = await supabase.from('meals').insert([insertPayload]);
      if (error) console.error("Error inserting scanned meal:", error);

      fetchMeals();
      setActiveTab('dashboard');
      setScanResult(null);
      setScanInput('');
      setScanStatus('idle');
    } catch (err) {
      console.error(err);
    }
  };

  // PEXELS API USED FOR IMAGES

  const handleGenerateDietPlan = async (force = false, overrideUser = null, retryCount = 0) => {
    if (dietPlan && !force) return;
    
    // Rate Limiting Logic (3 per hour)
    if (force && retryCount === 0) {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      let timestamps = JSON.parse(localStorage.getItem('diet_plan_timestamps') || '[]');
      
      // Filter timestamps to only those within the last hour
      timestamps = timestamps.filter(ts => now - ts < oneHour);
      
      if (timestamps.length >= 3) {
        alert("You have reached the limit of 3 diet plan regenerations per hour. Please try again later.");
        return;
      }
      
      timestamps.push(now);
      localStorage.setItem('diet_plan_timestamps', JSON.stringify(timestamps));
    }

    setPlanStatus('loading');
    const hasKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY';
    const activeUser = overrideUser || user;
    const calTarget = activeUser?.dailyCalorieTarget || 2000;

    if (!hasKey) {
      alert("Please configure a valid Gemini API key to generate a true AI diet plan. Offline mock plans have been disabled to ensure single source of truth.");
      setPlanStatus('idle');
      return;
    }

    try {
      let conditionRules = '';
      if (onboarding.conditions?.length > 0) {
        conditionRules = onboarding.conditions.map(c => {
          if (c === 'Diabetes') return 'Ensure low glycemic index foods, controlled carbs, and high-fiber ingredients. Strictly avoid high-sugar foods.';
          if (c === 'BP' || c === 'Hypertension') return 'Ensure meals are low sodium and heart-healthy. Avoid excessive salt and highly processed ingredients.';
          if (c === 'PCOS') return 'Prioritize low GI foods, anti-inflammatory ingredients, and balanced protein intake.';
          if (c === 'Thyroid') return 'Provide thyroid-aware nutrition, avoiding goitrogen overconsumption.';
          if (c === 'High Cholesterol') return 'Focus on heart-friendly foods, high fiber, and strictly limit saturated fats.';
          return `Adhere to dietary guidelines for ${c}.`;
        }).join(' ');
      }
      
      const allergyRule = onboarding.allergies ? `CRITICAL: The user is allergic to ${onboarding.allergies}. You MUST completely exclude these ingredients.` : '';

      let dietRule = '';
      const pref = onboarding.dietPreference || 'Balanced';
      if (pref === 'Vegetarian') {
        dietRule = 'CRITICAL RULE: The user is VEGETARIAN. You MUST absolutely exclude all meat, chicken, fish, seafood, mutton, beef, pork, and poultry. Eggs are only allowed if explicitly requested.';
      } else if (pref === 'Vegan') {
        dietRule = 'CRITICAL RULE: The user is VEGAN. You MUST absolutely exclude ALL animal-derived products including meat, poultry, fish, seafood, eggs, milk, cheese, yogurt, honey, and dairy.';
      } else if (pref === 'Eggetarian') {
        dietRule = 'CRITICAL RULE: The user is EGGETARIAN. You MUST absolutely exclude all meat, chicken, fish, seafood, mutton, beef, and pork. However, EGGS are completely allowed. Dairy is allowed.';
      } else {
        dietRule = 'Diet Preference: Non-Vegetarian / Balanced. You may include meat, chicken, fish, seafood, eggs, and dairy where appropriate.';
      }

      const bmi = onboarding.height && onboarding.weight ? (onboarding.weight / ((onboarding.height / 100) ** 2)).toFixed(1) : 'Unknown';

      const prompt = `
        Generate a COMPLETELY UNIQUE 7-day meal plan for a daily target of ${calTarget} kcal. 
        User Profile: Age ${onboarding.age}, Height ${onboarding.height}cm, Weight ${onboarding.weight}kg, BMI: ${bmi}, Activity: ${onboarding.activity}, Lifestyle: ${onboarding.activity}.
        Goal: ${onboarding.goal} (Target Weight: ${onboarding.targetWeight}kg).
        Dietary Preference: ${onboarding.dietPreference || 'Balanced'}.
        ${dietRule}
        Target Macros: Protein ${activeUser?.proteinTarget || 'balanced'}g, Carbs ${activeUser?.carbTarget || 'balanced'}g, Fat ${activeUser?.fatTarget || 'balanced'}g.
        ${conditionRules}
        ${allergyRule}
        (Random Generation Seed/Timestamp: ${Date.now()}_${Math.random()})
        INSTRUCTION: You must strictly adhere to ALL dietary preferences, allergies, and health conditions above.
        For each day of the week (Mon, Tue, Wed, Thu, Fri, Sat, Sun), create 4 distinct meals (Breakfast, Lunch, Snack, Dinner). 
        You MUST provide high variety. Do not repeat the exact same meals from day to day.
        Before generating, verify that every single meal complies with the selected conditions and strictly excludes allergens.
        Return ONLY valid JSON.
        Do NOT add explanations.
        Do NOT add markdown.
        Do NOT add code fences.
        Do NOT add notes.
        Do NOT add commentary.
        Do NOT add headings.
        Output must be a single valid JSON object matching this exact schema:
        {"coachAdvice": "Clinical recommendations summary under 100 words", "days": [{"dayName": "Mon", "meals": [{"time": "08:30 AM", "name": "Unique meal name", "calories": 400, "protein": 20, "carbs": 40, "fat": 15, "desc": "description", "imgKey": "oats"}]}]}
        
        CRITICAL INSTRUCTION: You MUST generate your ENTIRE response (meal names, descriptions, coach advice, day names, etc.) exclusively in the ${currentLanguageName} language.
      `;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.5 } })
      });

      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        let clean = rawText.trim();
        // Extract strictly the first balanced JSON object
        let extractedJson = clean;
        const startIndex = clean.indexOf('{');
        if (startIndex !== -1) {
          let braceCount = 0;
          for (let i = startIndex; i < clean.length; i++) {
            if (clean[i] === '{') braceCount++;
            else if (clean[i] === '}') braceCount--;
            
            if (braceCount === 0) {
              extractedJson = clean.substring(startIndex, i + 1);
              break;
            }
          }
        }
        
        console.log("RAW RESPONSE:", rawText);
        console.log("EXTRACTED JSON:", extractedJson);
        
        let parsed;
        try {
          parsed = JSON.parse(extractedJson);
        } catch (parseError) {
          console.error("Failed to parse AI JSON. Raw text was:", rawText);
          if (retryCount < 1) {
            console.warn("Retrying AI Generation (JSON parse failure)...");
            return handleGenerateDietPlan(force, overrideUser, retryCount + 1);
          }
          throw new Error("Failed to parse AI response JSON: " + parseError.message);
        }
        
        // Validation Layer
        const currentPref = onboarding.dietPreference || 'Balanced';
        parsed.days = await Promise.all(parsed.days.map(async d => ({
          ...d,
          meals: await Promise.all(d.meals.map(async m => {
            let modifiedMeal = { ...m };
            const lowerName = m.name.toLowerCase();
            const lowerDesc = m.desc.toLowerCase();
            const hasMeat = /chicken|beef|pork|mutton|salmon|fish|seafood|meat|steak/i.test(lowerName) || /chicken|beef|pork|mutton|salmon|fish|seafood|meat|steak/i.test(lowerDesc);
            const hasDairy = /milk|cheese|yogurt|dairy|butter|ghee/i.test(lowerName) || /milk|cheese|yogurt|dairy|butter|ghee/i.test(lowerDesc);
            const hasEgg = /egg|omelette|frittata/i.test(lowerName) || /egg|omelette|frittata/i.test(lowerDesc);

            if (currentPref === 'Vegan' && (hasMeat || hasDairy || hasEgg)) {
              modifiedMeal.name = "Plant-Based Power Bowl";
              modifiedMeal.desc = "A balanced mix of lentils, quinoa, and roasted vegetables.";
            } else if (currentPref === 'Vegetarian' && hasMeat) {
              modifiedMeal.name = "Hearty Lentil Soup";
              modifiedMeal.desc = "Rich lentil stew with carrots and celery.";
            } else if (currentPref === 'Eggetarian' && hasMeat) {
              modifiedMeal.name = "Egg & Spinach Scramble";
              modifiedMeal.desc = "Scrambled eggs with fresh spinach and whole wheat toast.";
            }
            
            // Dynamically fetch actual high-quality food image
            const pexelsRes = await fetchPexelsImage(modifiedMeal.name);
            modifiedMeal.img = pexelsRes.url;
            modifiedMeal.isCached = pexelsRes.isCached;
            return modifiedMeal;
          }))
        })));
        
        parsed.isRealAI = true;
        setDietPlan(parsed);
        setPlanStatus('success');
      } else {
        console.error("Invalid AI response. Full resData:", resData);
        if (retryCount < 1) {
          console.warn("Retrying AI Generation (Invalid response)...");
          return handleGenerateDietPlan(force, overrideUser, retryCount + 1);
        }
        throw new Error("Invalid AI response from Gemini API.");
      }
    } catch (e) {
      console.error(e);
      if (retryCount < 1) {
        console.warn("Retrying AI Generation (Outer catch)...");
        return handleGenerateDietPlan(force, overrideUser, retryCount + 1);
      }
      alert("AI Generation failed:\n" + e.message);
      setPlanStatus('idle');
    }
  };

  const handleLanguageChange = async (lang) => {
    const code = lang.toLowerCase();
    localStorage.setItem('vitascan_lang', code);
    if (user) {
      setUser(prev => prev ? { ...prev, preferredLanguage: code } : null);
    }
    try {
      if (user?.id) {
        const { error } = await supabase.from('profiles').update({ preferred_language: code }).eq('id', user.id);
        if (error) throw error;
      }
    } catch (err) {
      console.error("Could not sync language to backend:", err);
    }
  };

  const handleProfileNameChange = async (newName) => {
    if (user) {
      setUser(prev => prev ? { ...prev, name: newName } : null);
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (user?.id && session?.user?.id === user.id) {
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
        let data, error;
        if (existingProfile) {
          ({ data, error } = await supabase.from('profiles').update({ name: newName }).eq('id', user.id).select().maybeSingle());
        } else {
          ({ data, error } = await supabase.from('profiles').insert({ id: user.id, name: newName }).select().maybeSingle());
        }
        if (error) throw error;
        if (data) {
          setUser(normalizeUser(data));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettingsProfileSubmit = async (e) => {
    e.preventDefault();
    const targets = calculateMetabolicTargets(onboarding);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Unable to save profile. Please sign in again and try.");
        return;
      }
      const userId = session.user.id;

      if (user?.id && user.id === userId) {
        const profileData = {
          name: onboarding.name, 
          age: onboarding.age, 
          height: onboarding.height, 
          weight: onboarding.weight,
          target_weight: onboarding.targetWeight, 
          goal: onboarding.goal, 
          activity_level: onboarding.activity,
          health_conditions: onboarding.conditions.join(','), 
          daily_calorie_target: targets.dailyTarget,
          protein_target: targets.proteinTarget,
          carb_target: targets.carbTarget,
          fat_target: targets.fatTarget,
          water_target: targets.waterTarget,
          allergies: onboarding.allergies || '',
          diet_preference: onboarding.dietPreference || 'Balanced'
        };

        console.log("=== DEBUG PROFILE UPDATE ===");
        console.log("auth.uid():", userId);
        console.log("Profile Payload:", profileData);
        
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
        console.log("Existing Profile:", existingProfile);

        let data, error;
        if (existingProfile) {
          console.log("Operation: UPDATE");
          ({ data, error } = await supabase.from('profiles').update(profileData).eq('id', userId).select().maybeSingle());
        } else {
          console.log("Operation: INSERT");
          ({ data, error } = await supabase.from('profiles').insert({ id: userId, ...profileData }).select().maybeSingle());
        }

        console.log("Supabase Response Data:", data);
        console.log("Supabase Error:", error);

        if (error) {
          alert('Database Error:\n' + JSON.stringify(error, null, 2));
          return;
        }
        if (data) {
          const updatedUser = normalizeUser(data);
          setUser(updatedUser);
        }

        setProfileStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setProfileStatusMsg({ type: '', text: '' }), 4000);
      }
      
      if (user?.id) {
        try {
          const lastRecord = weightRecords.length > 0 ? weightRecords[0] : null;
          if (!lastRecord || lastRecord.weight !== onboarding.weight) {
            await supabase.from('weight_records').insert([
              { user_id: user.id, weight: onboarding.weight, timestamp: Date.now() }
            ]);
          }
        } catch (weightErr) {
          console.warn("Could not sync weight update to database:", weightErr);
        }
      }
      fetchWeightRecords();
    } catch (err) {
      console.error(err);
      alert('Error saving profile: ' + err.message);
    }
  };

  // Splash Screen Render
  if (appState === 'splash') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0B0F19' }}>
        <div style={{ fontSize: '5rem', marginBottom: '16px', animation: 'pulse-glow 1.5s infinite' }}>🥗</div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>VitaScan</h1>
        <p style={{ color: '#FF7050', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '8px' }}>AI-Powered Health Assistant</p>
      </div>
    );
  }

  // Login Screen Render
  if (appState === 'login') {
    return (
      <div className="login-wrapper">
        <div className="glass-card login-card animate-fade-in">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255, 112, 80, 0.08)', borderRadius: '16px', marginBottom: '16px' }}>
              <HeartPulse size={28} color="var(--primary)" />
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.03em' }}>VitaScan</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {authForm.isSignup ? "Welcome to VitaScan" : "Welcome Back"}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
              {authForm.isSignup ? "Create an account to begin clinical tracking" : "Access to VitaScan Profile"}
            </p>
          </div>

          {authStatusMsg.text && (
            <div className="glass-card" style={{ 
              padding: '12px 16px', 
              borderRadius: '12px', 
              marginBottom: '24px', 
              fontSize: '0.85rem',
              border: '1px solid',
              borderColor: authStatusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              background: authStatusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
              color: authStatusMsg.type === 'error' ? '#EF4444' : '#10B981',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Info size={16} />
              <span>{authStatusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {authForm.isSignup && (
              <div className="auth-form-group">
                <label className="input-label">Display Name</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder="e.g. Krish" 
                  value={authForm.name} 
                  onChange={e => setAuthForm({...authForm, name: e.target.value})} 
                  disabled={isAuthLoading}
                />
              </div>
            )}

            <div className="auth-form-group">
              <label className="input-label">Email Address</label>
              <input 
                type="email" 
                required 
                className="form-input" 
                placeholder="krish@example.com" 
                value={authForm.email} 
                onChange={e => setAuthForm({...authForm, email: e.target.value})} 
                disabled={isAuthLoading}
              />
            </div>

            <div className="auth-form-group">
              <label className="input-label">Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={authForm.password} 
                  onChange={e => setAuthForm({...authForm, password: e.target.value})} 
                  disabled={isAuthLoading}
                  style={{ width: '100%', paddingRight: '48px' }}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>



            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={isAuthLoading}
            >
              {isAuthLoading ? (
                <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              ) : null}
              {isAuthLoading ? "Authenticating..." : (authForm.isSignup ? "Create Account" : "Sign In")}
            </button>
          </form>

          <button 
            className="btn-link" 
            style={{ marginTop: '24px', width: '100%', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}
            onClick={() => {
              setAuthForm({...authForm, isSignup: !authForm.isSignup});
              setAuthStatusMsg({ type: '', text: '' });
            }}
            disabled={isAuthLoading}
          >
            {authForm.isSignup ? "Already have an account? Sign In" : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    );
  }

  // Onboarding Screen Render
  if (appState === 'onboarding') {
    return (
      <div className="login-wrapper" style={{ overflowY: 'auto', padding: '40px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card login-card animate-fade-in" style={{ maxWidth: '640px', width: '100%', padding: '40px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(255, 112, 80, 0.08)', borderRadius: '16px', marginBottom: '16px' }}>
              <HeartPulse size={28} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>Set Up Your Health Profile</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>Let's customize your calorie targets, diet rules, and AI parameters</p>
          </div>

          {/* Progress Indicators */}
          <div className="onboarding-progress-container">
            <div className="onboarding-progress-bar-bg" />
            <div 
              className="onboarding-progress-bar-fill" 
              style={{ width: `${((onboardingStep - 1) / 2) * 100}%` }} 
            />
            
            <div className={`onboarding-step-indicator ${onboardingStep >= 1 ? 'active' : ''} ${onboardingStep > 1 ? 'completed' : ''}`}>
              {onboardingStep > 1 ? <Check size={16} /> : "1"}
            </div>
            <div className={`onboarding-step-indicator ${onboardingStep >= 2 ? 'active' : ''} ${onboardingStep > 2 ? 'completed' : ''}`}>
              {onboardingStep > 2 ? <Check size={16} /> : "2"}
            </div>
            <div className={`onboarding-step-indicator ${onboardingStep >= 3 ? 'active' : ''}`}>
              3
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (onboardingStep < 3) {
              setOnboardingStep(prev => prev + 1);
            } else {
              handleOnboardingSubmit(e);
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* STEP 1: Basic identity & main health goal */}
            {onboardingStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Step 1: Basic Information
                </h3>
                
                <div>
                  <label className="input-label">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="e.g. Krish"
                    value={onboarding.name} 
                    onChange={e => setOnboarding({...onboarding, name: e.target.value})} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="input-label">Age (years)</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      max="120"
                      className="form-input" 
                      placeholder="e.g. 25"
                      value={onboarding.age} 
                      onChange={e => setOnboarding({...onboarding, age: e.target.value === '' ? '' : parseInt(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="input-label">Weight Goal</label>
                    <select className="form-select" value={onboarding.goal} onChange={e => setOnboarding({...onboarding, goal: e.target.value})}>
                      <option value="Lose Weight">Lose Weight</option>
                      <option value="Gain Weight">Gain Weight</option>
                      <option value="Manage Health Issue">Fit Lifestyle / Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Physical metrics and lifestyle */}
            {onboardingStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Step 2: Biometrics & Activity
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="input-label">Height (cm)</label>
                    <input 
                      type="number" 
                      required 
                      min="50"
                      max="280"
                      className="form-input" 
                      placeholder="e.g. 170"
                      value={onboarding.height} 
                      onChange={e => setOnboarding({...onboarding, height: e.target.value === '' ? '' : parseFloat(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="input-label">Weight (kg)</label>
                    <input 
                      type="number" 
                      required 
                      min="20"
                      max="300"
                      className="form-input" 
                      placeholder="e.g. 70"
                      value={onboarding.weight} 
                      onChange={e => setOnboarding({...onboarding, weight: e.target.value === '' ? '' : parseFloat(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="input-label">Target Weight (kg)</label>
                    <input 
                      type="number" 
                      required 
                      min="20"
                      max="300"
                      className="form-input" 
                      placeholder="e.g. 65"
                      value={onboarding.targetWeight} 
                      onChange={e => setOnboarding({...onboarding, targetWeight: e.target.value === '' ? '' : parseFloat(e.target.value)})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Activity Level</label>
                  <select className="form-select" value={onboarding.activity} onChange={e => setOnboarding({...onboarding, activity: e.target.value})}>
                    <option value="Sedentary">Sedentary (No Exercise)</option>
                    <option value="Moderate">Moderate (3-4 days/week)</option>
                    <option value="Active">Highly Active (Daily/Athlete)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: Dietary Rules & Conditions */}
            {onboardingStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Step 3: Medical & Dietary Preferences
                </h3>

                <div>
                  <label className="input-label">Dietary Preference</label>
                  <select className="form-select" value={onboarding.dietPreference} onChange={e => setOnboarding({...onboarding, dietPreference: e.target.value})}>
                    <option value="Balanced">Balanced / Non-Veg</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Keto">Keto (Low-Carb, High-Fat)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Active Health Conditions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {['Diabetes', 'BP', 'PCOS', 'Thyroid', 'High Cholesterol'].map(cond => {
                      const isChecked = onboarding.conditions.includes(cond);
                      return (
                        <label key={cond} style={{ 
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                          background: isChecked ? 'var(--primary-glow)' : 'var(--bg-unselected)',
                          border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'}`,
                          borderRadius: '16px', cursor: 'pointer', fontSize: '0.9rem'
                        }}>
                          <input 
                            type="checkbox" checked={isChecked} style={{ accentColor: 'var(--primary)' }}
                            onChange={() => {
                              const next = isChecked ? onboarding.conditions.filter(c => c !== cond) : [...onboarding.conditions, cond];
                              setOnboarding({...onboarding, conditions: next});
                            }}
                          />
                          <span style={{ color: isChecked ? 'var(--primary)' : 'var(--text-main)' }}>{cond}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="input-label">Food Allergies & Intolerances</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {['Gluten', 'Dairy', 'Peanuts', 'Tree Nuts', 'Shellfish', 'Soy', 'Eggs'].map(allergy => {
                      const currentAllergies = onboarding.allergies ? onboarding.allergies.split(',').map(a => a.trim()).filter(a => a) : [];
                      const isSelected = currentAllergies.includes(allergy);
                      return (
                        <button 
                          key={allergy} 
                          type="button"
                          onClick={() => {
                            let newAllergies = [...currentAllergies];
                            if (isSelected) newAllergies = newAllergies.filter(a => a !== allergy);
                            else newAllergies.push(allergy);
                            setOnboarding({...onboarding, allergies: newAllergies.join(', ')});
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                            background: isSelected ? 'var(--primary-glow)' : 'transparent',
                            color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem'
                          }}
                        >
                          {allergy}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '12px' }}>
              {onboardingStep > 1 ? (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setOnboardingStep(prev => prev - 1)}
                >
                  Back
                </button>
              ) : null}
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 2 }}
              >
                {onboardingStep === 3 ? "Complete Profile Setup" : "Continue to Next Step"}
              </button>
            </div>

          </form>
        </div>
      </div>
    );
  }

  // Dashboard calculations
  const todayDateStrFormatted = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  const todayMeals = meals.filter(m => {
    // Supabase returns bigint as numeric strings which breaks new Date("17170..."). Convert safely.
    const parsedTs = isNaN(Number(m.timestamp)) ? m.timestamp : Number(m.timestamp);
    const d = new Date(parsedTs);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const calorieTarget = user?.dailyCalorieTarget || 0;
  const caloriesConsumed = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const caloriesRemaining = Math.max(0, calorieTarget - caloriesConsumed);
  const calPercent = calorieTarget > 0 ? Math.min(100, Math.round((caloriesConsumed / calorieTarget) * 100)) : 0;

  const userWeight = user?.weight || 0;
  const pTarget = user?.proteinTarget || (userWeight > 0 ? Math.round(userWeight * 1.5) : 0);
  const cTarget = user?.carbTarget || (userWeight > 0 ? Math.round(userWeight * 2.5) : 0);
  const fTarget = user?.fatTarget || (userWeight > 0 ? Math.round(userWeight * 0.8) : 0);
  const wTarget = user?.waterTarget || 0.0;

  const pConsumed = todayMeals.reduce((sum, m) => sum + m.protein, 0);
  const cConsumed = todayMeals.reduce((sum, m) => sum + m.carbs, 0);
  const fConsumed = todayMeals.reduce((sum, m) => sum + m.fat, 0);

  const avgHealth = todayMeals.length > 0 ? (todayMeals.reduce((sum, m) => sum + m.healthScore, 0) / todayMeals.length).toFixed(1) : '8.4';

  return (
    <div className="dashboard-layout">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
          <div style={{ fontSize: '2rem' }}>🥗</div>
          <div>
            <h2 style={{ fontSize: '1.4rem', letterSpacing: '-0.03em' }}>VitaScan</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>Cloud Console</span>
          </div>
        </div>

        <nav className="sidebar-links">
          <button className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> {t.home}
          </button>
          <button className={`sidebar-btn ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => { setActiveTab('scan'); setScanStatus('idle'); setScanResult(null); }}>
            <Camera size={18} /> {t.scan}
          </button>
          <button className={`sidebar-btn ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => { setActiveTab('plan'); handleGenerateDietPlan(); }}>
            <Calendar size={18} /> {t.plan}
          </button>
          <button className={`sidebar-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <Activity size={18} /> {t.reports}
          </button>
          <button className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); fetchUser(); }}>
            <Sliders size={18} /> {t.settings}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="profile-initials">
              {user.name ? user.name.substring(0, 2).toUpperCase() : 'AS'}
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem' }}>{user.name}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: {user.targetWeight} kg</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content animate-fade-in">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '0.1em' }}>SUMMARY PROFILE</span>
                <h1 style={{ fontSize: '2.5rem', marginTop: '4px' }}>Welcome, {user.name}!</h1>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setSelectedMealType('Breakfast');
                    setShowAddMealModal(true);
                  }}
                >
                  <Plus size={16} /> Log Meal
                </button>
                <button className="btn btn-primary" onClick={() => setActiveTab('scan')}>
                  <Camera size={16} /> Scan Food
                </button>
              </div>
            </div>

            {/* Dashboard Metric Grid */}
            <div className="grid-3">
              {/* Calorie Stats Circle Card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div className="progress-ring-wrapper">
                  <svg width="150" height="150" viewBox="0 0 150 150">
                    <circle cx="75" cy="75" r="62" stroke="rgba(255,255,255,0.04)" strokeWidth="8" fill="transparent" />
                    <circle cx="75" cy="75" r="62" stroke="var(--primary)" strokeWidth="8" fill="transparent"
                      strokeDasharray="390"
                      strokeDashoffset={390 - (390 * calPercent) / 100}
                      strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{caloriesRemaining}</h2>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>KCAL REMAINING</span>
                  </div>
                </div>
                
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '0.85rem' }}>
                  <span>Eaten: <strong>{caloriesConsumed} kcal</strong></span>
                  <span>Goal: <strong>{calorieTarget} kcal</strong></span>
                </div>
              </div>

              {/* Macronutrient Status Card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h3>Today's Macronutrients</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Protein */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>Protein</span>
                      <span style={{ color: 'var(--color-protein)' }}>{Math.round(pConsumed)}g / {pTarget}g</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                      <div style={{ height: '100%', background: 'var(--color-protein)', width: `${Math.min(100, (pConsumed/pTarget)*100)}%`, borderRadius: '6px' }}></div>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>Carbohydrates</span>
                      <span style={{ color: 'var(--color-carbs)' }}>{Math.round(cConsumed)}g / {cTarget}g</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                      <div style={{ height: '100%', background: 'var(--color-carbs)', width: `${Math.min(100, (cConsumed/cTarget)*100)}%`, borderRadius: '6px' }}></div>
                    </div>
                  </div>

                  {/* Fat */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>Fats</span>
                      <span style={{ color: 'var(--color-fat)' }}>{Math.round(fConsumed)}g / {fTarget}g</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                      <div style={{ height: '100%', background: 'var(--color-fat)', width: `${Math.min(100, (fConsumed/fTarget)*100)}%`, borderRadius: '6px' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Water Log & Health stats Card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Hydration Log</h3>
                  <span style={{ display: 'inline-flex', padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px' }}>
                    <Droplet size={18} color="#3B82F6" />
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '14px 0' }}>
                  <button className="water-btn-circle" onClick={() => updateWater(-0.25)}>-</button>
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.2rem', color: '#3B82F6', fontWeight: 900 }}>{waterLiters.toFixed(2)}L</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: {wTarget}L</span>
                  </div>
                  <button className="water-btn-circle" onClick={() => updateWater(0.25)}>+</button>
                </div>

                <button className="btn btn-secondary" style={{ width: '100%', padding: '10px' }} onClick={() => setShowWaterModal(true)}>
                  Log Custom container
                </button>
              </div>
            </div>

            {/* Quick Average Health Score Widget */}
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(255,112,80,0.08) 0%, rgba(16,185,129,0.08) 100%)', border: '1px solid rgba(255,112,80,0.15)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '2rem', padding: '10px', background: 'var(--bg-main)', borderRadius: '16px' }}>🥦</div>
                <div>
                  <h4 style={{ fontSize: '1.1rem' }}>Today's Average Food Health Score: {avgHealth} / 10</h4>
                  <p style={{ fontSize: '0.85rem' }}>Calculated dynamic rating based on the nutritional quality of logged meals.</p>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setShowCoachModal(true)}>Coach Tips 💡</button>
            </div>

            {/* Today's Meals Section */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '20px' }}>{t.today_meals}</h3>
              <p style={{ color: 'yellow', marginBottom: '10px' }}>Total meals fetched: {todayMeals.length}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(category => {
                  const categoryMeals = todayMeals.filter(m => (m.mealType || m.meal_type || '').toLowerCase() === category.toLowerCase());
                  const categoryCal = categoryMeals.reduce((sum, m) => sum + m.calories, 0);
                  const emoji = category === 'Breakfast' ? '🍳' : category === 'Lunch' ? '🍲' : category === 'Dinner' ? '🥗' : '🍎';
                  
                  return (
                    <div key={category} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t[category.toLowerCase()]}</h4>
                          {categoryCal > 0 && (
                            <span style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                              {categoryCal} kcal
                            </span>
                          )}
                        </div>
                        
                        <button 
                          className="water-btn-circle" style={{ width: '28px', height: '28px' }}
                          onClick={() => {
                            setSelectedMealType(category);
                            setShowAddMealModal(true);
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {categoryMeals.length === 0 ? (
                        <div 
                          className="empty-dashed-slot"
                          onClick={() => {
                            setSelectedMealType(category);
                            setShowAddMealModal(true);
                          }}
                        >
                          + Log {category}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {categoryMeals.map(meal => (
                            <div key={meal.id} className="meal-row-web">
                              <span style={{ fontSize: '2rem' }}>{meal.emoji}</span>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '0.95rem' }}>{meal.name || meal.food_name}</h4>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  <span>{meal.calories} kcal</span>
                                  <span>•</span>
                                  <span style={{ color: 'var(--color-protein)' }}>Protein: {Math.round(meal.protein)}g</span>
                                  <span>•</span>
                                  <span style={{ color: 'var(--color-carbs)' }}>Carbs: {Math.round(meal.carbs)}g</span>
                                  <span>•</span>
                                  <span style={{ color: 'var(--color-fat)' }}>Fats: {Math.round(meal.fat)}g</span>
                                </div>
                              </div>
                              <button className="btn-trash-web" onClick={() => handleDeleteMeal(meal.id)}>
                                <Trash2 size={16} color="#EF4444" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: AI SCANNER */}
        {activeTab === 'scan' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
              <span className="badge badge-success">Google Gemini AI</span>
              <h1 style={{ fontSize: '2.5rem', marginTop: '8px' }}>{t.scan_title}</h1>
              <p style={{ marginTop: '8px', maxWidth: '600px', margin: '8px auto 0 auto' }}>{t.scan_desc}</p>
            </div>

            {scanStatus === 'idle' && (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <button className={`btn ${scanTab === 'camera' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setScanTab('camera')}>
                    <Camera size={16} /> Camera / Photo
                  </button>
                  <button className={`btn ${scanTab === 'text' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setScanTab('text')}>
                    <FileText size={16} /> Analyze Text Prompt
                  </button>
                </div>

                {scanTab === 'camera' && (
                  <div>
                    <span className="input-label">Select Dish Photograph</span>
                    <label className="web-camera-picker">
                      <input 
                        type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => {
                          if (e.target.files?.[0]) {
                            setScanImage(e.target.files[0]);
                            setScanImagePreview(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                      />
                      {scanImagePreview ? (
                        <img src={scanImagePreview} alt="Upload Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <>
                          <Camera size={44} color="var(--primary)" style={{ marginBottom: '10px' }} />
                          <span style={{ fontWeight: 'bold' }}>Drop image here or click to select</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>JPG, JPEG, PNG</span>
                        </>
                      )}
                    </label>
                    <button className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={() => handleScanFood()} disabled={!scanImage}>
                      Analyze Food Photo <Sparkles size={16} />
                    </button>
                  </div>
                )}

                {scanTab === 'text' && (
                  <div>
                    <label className="input-label">Type Meal Details</label>
                    <input 
                      type="text" className="form-input" placeholder="e.g. 2 Paneer Parathas and a cup of low-fat yoghurt..."
                      value={scanInput} onChange={e => setScanInput(e.target.value)}
                    />
                    <button className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={() => handleScanFood()} disabled={!scanInput.trim()}>
                      Analyze Text <Sparkles size={16} />
                    </button>
                  </div>
                )}

              </div>
            )}

            {scanStatus === 'loading' && (
              <div className="glass-card" style={{ padding: '80px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ animation: 'pulse-glow 1.5s infinite', display: 'inline-flex', padding: '20px', background: 'var(--primary-glow)', borderRadius: '50%' }}>
                  <Sparkles size={36} color="var(--primary)" />
                </div>
                <h3>{t.analyzing}</h3>
                <p>Generating nutrition score matrix and coach advice...</p>
              </div>
            )}

            {scanStatus === 'success' && scanResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <button className="btn btn-secondary" style={{ width: 'fit-content' }} onClick={() => { setScanStatus('idle'); setScanResult(null); }}>
                  ← Scan another food item
                </button>

                {scanResult.confidence !== undefined && scanResult.confidence < 0.7 && (
                  <div className="glass-card" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Info size={20} color="#EF4444" />
                    <div>
                      <h4 style={{ color: '#EF4444' }}>Food could not be identified accurately.</h4>
                      <p style={{ fontSize: '0.85rem' }}>Confidence: {Math.round(scanResult.confidence * 100)}%. Please upload a clearer image.</p>
                      {scanResult.possibleMatches && scanResult.possibleMatches.length > 0 && (
                        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}><strong>Possible matches:</strong> {scanResult.possibleMatches.join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Score & Macros grid */}
                <div className="glass-card grid-2" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', width: '70px', height: '70px', background: 'var(--primary-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {scanResult.emoji}
                    </div>
                    <h2>{scanResult.foodName}</h2>
                    <span style={{ fontSize: '1rem', fontWeight: 'bold', padding: '4px 16px', background: scanResult.healthScore >= 7 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: scanResult.healthScore >= 7 ? 'var(--secondary)' : '#F59E0B', borderRadius: '16px' }}>
                      Health Rating: {scanResult.healthScore} / 10
                    </span>
                  </div>

                  <div className="grid-2">
                    <div className="macro-card-web">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Calories</span>
                      <h3 style={{ color: 'var(--color-calories)' }}>{scanResult.calories} kcal</h3>
                    </div>
                    <div className="macro-card-web">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Protein</span>
                      <h3 style={{ color: 'var(--color-protein)' }}>{Math.round(scanResult.protein)}g</h3>
                    </div>
                    <div className="macro-card-web">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Carbohydrates</span>
                      <h3 style={{ color: 'var(--color-carbs)' }}>{Math.round(scanResult.carbs)}g</h3>
                    </div>
                    <div className="macro-card-web">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Fats</span>
                      <h3 style={{ color: 'var(--color-fat)' }}>{Math.round(scanResult.fat)}g</h3>
                    </div>
                  </div>
                </div>

                {/* Pros & Cons list grid */}
                <div className="grid-2">
                  <div className="glass-card">
                    <h4 style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <ThumbsUp size={16} /> Pros
                    </h4>
                    <ul className="bullet-list">
                      {scanResult.pros?.map((p, i) => (
                        <li key={i} className="bullet-item">
                          <span className="bullet-dot" style={{ background: 'var(--secondary)' }}></span>
                          <span style={{ fontSize: '0.9rem' }}>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-card">
                    <h4 style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <ThumbsDown size={16} /> Cons
                    </h4>
                    <ul className="bullet-list">
                      {scanResult.cons?.map((c, i) => (
                        <li key={i} className="bullet-item">
                          <span className="bullet-dot" style={{ background: '#EF4444' }}></span>
                          <span style={{ fontSize: '0.9rem' }}>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Coach Advice */}
                <div className="glass-card">
                  <h3>Clinical Coach Advice</h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', padding: '16px', background: 'rgba(255,255,255,0.01)', borderLeft: '3px solid var(--primary)', borderRadius: '8px', marginTop: '12px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {scanResult.advice}
                  </p>
                  
                  <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Estimated Ingredients</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {scanResult.ingredients?.map((ing, i) => (
                      <span key={i} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }}>
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add options */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: '16px' }}>Log this scanned meal:</h3>
                  <div className="grid-4">
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                      <button key={type} className="btn btn-secondary" onClick={() => logScannedMeal(type)}>{type}</button>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 3: DIET PLANNER */}
        {activeTab === 'plan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '0.15em' }}>7-DAY PLAN MATRIX</span>
                <h1 style={{ fontSize: '2.5rem', marginTop: '4px' }}>AI Diet Planner</h1>
              </div>
              <button className="btn btn-primary" onClick={() => handleGenerateDietPlan(true)}>
                Re-Generate Plan <Sparkles size={16} />
              </button>
            </div>

            {planStatus === 'loading' && (
              <div className="glass-card" style={{ padding: '80px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ animation: 'pulse-glow 1.5s infinite', display: 'inline-flex', padding: '20px', background: 'var(--primary-glow)', borderRadius: '50%' }}>
                  <Calendar size={36} color="var(--primary)" />
                </div>
                <h3>Formulating weekly nutrition matrix...</h3>
                <p>Computing macro distributions and caloric target splits based on your conditions...</p>
              </div>
            )}

            {planStatus === 'success' && dietPlan && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Advice Card */}
                <div className="glass-card" style={{ background: 'var(--primary-glow)', border: '1px solid rgba(255, 112, 80, 0.2)' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} /> Clinical Recommendations
                  </h4>
                  <p style={{ color: 'var(--text-main)', whiteSpace: 'pre-line' }}>{dietPlan.coachAdvice}</p>
                </div>

                {/* Days layout */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {dietPlan.days?.map(day => (
                    <div key={day.dayName} className="glass-card">
                      <h3 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
                        {day.dayName} Plan
                      </h3>
                      
                      <div className="grid-4">
                        {day.meals?.map((m, i) => (
                          <div key={i} className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', height: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0', overflow: 'hidden' }}>
                            {m.img && (
                              <img src={m.img} alt={m.name} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                            )}
                            <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                  <span>{m.time}</span>
                                  <span style={{ textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 'bold' }}>Meal {i+1}</span>
                                </div>
                                <h4 style={{ fontSize: '0.85rem', lineHeight: '1.3', marginBottom: '2px', fontWeight: 800 }}>{m.name}</h4>
                                <p style={{ fontSize: '0.75rem', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{m.desc}</p>
                              </div>
                              <div style={{ fontWeight: 'bold', color: 'var(--color-calories)', fontSize: '0.8rem', marginTop: '6px' }}>
                                {m.calories} kcal
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 4: REPORTS / ANALYTICS */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '0.15em' }}>BIOMETRIC PROGRESS</span>
                <h1 style={{ fontSize: '2.5rem', marginTop: '4px' }}>Weight Analytics</h1>
              </div>
            </div>

            <div className="grid-2">
              <div className="glass-card">
                <h3>Log weight entry</h3>
                <p style={{ marginBottom: '16px' }}>Update your weight status to map progress rates</p>
                <form 
                  onSubmit={e => { e.preventDefault(); handleAddWeight(e.target.weightInput.value); e.target.weightInput.value = ''; }} 
                  style={{ display: 'flex', gap: '12px' }}
                >
                  <input type="number" step="0.1" name="weightInput" required className="form-input" placeholder="Weight in kg (e.g. 70.5)" />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Save Record</button>
                </form>
              </div>

              <div className="glass-card grid-2" style={{ alignItems: 'center', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Weight</span>
                  <h2>{weightRecords.length > 0 ? weightRecords[0].weight : user.weight} kg</h2>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Weight</span>
                  <h2 style={{ color: 'var(--primary)' }}>{user.targetWeight} kg</h2>
                </div>
              </div>
            </div>

            {/* Progress Analytics Widget */}
            {(() => {
              const currentW = weightRecords.length > 0 ? parseFloat(weightRecords[0].weight) : parseFloat(user.weight || 0);
              const hasHistory = weightRecords.length > 1;
              const startW = hasHistory ? parseFloat(weightRecords[weightRecords.length - 1].weight) : currentW;
              const targetW = parseFloat(user.targetWeight) || startW;
              const totalChange = currentW - startW;
              const changeLabel = hasHistory ? (totalChange > 0 ? `+${totalChange.toFixed(1)}` : totalChange.toFixed(1)) : "--";
              
              // Progress %
              let progressLabel = "--";
              if (hasHistory && startW !== targetW) {
                progressLabel = Math.max(0, Math.min(100, ((startW - currentW) / (startW - targetW)) * 100)).toFixed(0) + "%";
              } else if (!hasHistory && currentW !== targetW) {
                progressLabel = "Need Logs";
              } else if (currentW === targetW) {
                progressLabel = "100%";
              }

              // Weekly Rate
              let weeklyRateLabel = "--";
              let weeklyRate = 0;
              if (hasHistory) {
                const oldestDate = weightRecords[weightRecords.length - 1].timestamp;
                const weeksPassed = Math.max(1, (Date.now() - oldestDate) / (1000 * 60 * 60 * 24 * 7));
                weeklyRate = totalChange / weeksPassed;
                weeklyRateLabel = weeklyRate.toFixed(2) + " kg";
              }

              // ETA
              let etaText = "Goal Reached!";
              if (!hasHistory) {
                etaText = "Need more logs";
              } else if (currentW !== targetW) {
                if ((weeklyRate < 0 && targetW < currentW) || (weeklyRate > 0 && targetW > currentW)) {
                  const weeksLeft = Math.abs(currentW - targetW) / Math.abs(weeklyRate);
                  const etaDate = new Date(Date.now() + weeksLeft * 7 * 24 * 60 * 60 * 1000);
                  etaText = etaDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                } else {
                  etaText = "Needs Adjustment";
                }
              }

              // BMI
              const heightM = parseFloat(user.height || 170) / 100;
              const bmi = (currentW / (heightM * heightM)).toFixed(1);

              return (
                <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Change</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: totalChange <= 0 ? '#10B981' : '#F43F5E' }}>{changeLabel !== "--" ? `${changeLabel} kg` : changeLabel}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Goal Progress</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>{progressLabel}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Weekly Rate</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{weeklyRateLabel}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Est. Target</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{etaText}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Current BMI</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: (bmi < 18.5 || bmi > 25) ? '#F59E0B' : '#10B981' }}>{bmi}</div>
                  </div>
                </div>
              );
            })()}

            {/* Visual SVG Chart of Weight Records */}
            {weightRecords.length > 1 && (
              <div className="glass-card">
                <h3>Weight Trend Chart</h3>
                <p style={{ marginBottom: '20px' }}>Historical fluctuation trends mapped across entries</p>
                
                <div style={{ width: '100%', height: '240px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px' }}>
                  <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
                    {(() => {
                      const recordsSorted = [...weightRecords].sort((a,b) => a.timestamp - b.timestamp);
                      const weights = recordsSorted.map(r => r.weight);
                      const maxW = Math.max(...weights) + 1;
                      const minW = Math.min(...weights) - 1;
                      const wRange = maxW - minW || 1;

                      const points = recordsSorted.map((r, i) => {
                        const x = (i / (recordsSorted.length - 1 || 1)) * 440 + 30;
                        const y = 170 - ((r.weight - minW) / wRange) * 140;
                        return { x, y, weight: r.weight, label: new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
                      });

                      const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                      return (
                        <>
                          {/* Grid lines */}
                          <line x1="30" y1="30" x2="470" y2="30" stroke="rgba(255,255,255,0.04)" />
                          <line x1="30" y1="100" x2="470" y2="100" stroke="rgba(255,255,255,0.04)" />
                          <line x1="30" y1="170" x2="470" y2="170" stroke="rgba(255,255,255,0.06)" />

                          {/* Line Path */}
                          <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="3" />

                          {/* Data points & Responsive Labels */}
                          {points.map((p, i) => {
                            const isFirst = i === 0;
                            const isLast = i === points.length - 1;
                            const isMiddle = i === Math.floor(points.length / 2);
                            const showDate = isFirst || isLast || (isMiddle && points.length > 2);
                            
                            return (
                              <g key={i} className="chart-point" style={{ cursor: 'pointer' }}>
                                <circle cx={p.x} cy={p.y} r="6" fill="var(--primary)" stroke="var(--bg-main)" strokeWidth="2" />
                                <circle cx={p.x} cy={p.y} r="15" fill="transparent">
                                  <title>{p.weight}kg on {p.label}</title>
                                </circle>
                                {showDate && (
                                  <text x={p.x} y="195" fill="var(--text-muted)" fontSize="10" textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}>
                                    {p.label}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}

            {/* List Table */}
            <div className="glass-card">
              <h3>Biometric logs history</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                {weightRecords.map((rec, i) => {
                  const date = new Date(rec.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div key={rec.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span>{date}</span>
                      <strong style={{ color: 'var(--primary)' }}>{rec.weight} kg</strong>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Edit Profile Info Form */}
            <div className="glass-card">
              <h3>Edit Profile Information</h3>
              <p style={{ marginBottom: '20px' }}>Modify your biometrics to recalculate metabolic parameters</p>
              
              <form onSubmit={handleSettingsProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="input-label">Display Name</label>
                  <input type="text" className="form-input" value={onboarding.name} onChange={e => setOnboarding({...onboarding, name: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="input-label">Age (years)</label>
                    <input type="number" className="form-input" value={onboarding.age} onChange={e => setOnboarding({...onboarding, age: e.target.value === '' ? '' : parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="input-label">Activity Level</label>
                    <select className="form-select" value={onboarding.activity} onChange={e => setOnboarding({...onboarding, activity: e.target.value})}>
                      <option value="Sedentary">Sedentary (No Exercise)</option>
                      <option value="Moderate">Moderate (3-4 days/week)</option>
                      <option value="Active">Highly Active (Daily/Athlete)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="input-label">Height (cm)</label>
                    <input type="number" className="form-input" value={onboarding.height} onChange={e => setOnboarding({...onboarding, height: e.target.value === '' ? '' : parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="input-label">Weight (kg)</label>
                    <input type="number" className="form-input" value={onboarding.weight} onChange={e => setOnboarding({...onboarding, weight: e.target.value === '' ? '' : parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="input-label">Target Weight (kg)</label>
                    <input type="number" className="form-input" value={onboarding.targetWeight} onChange={e => setOnboarding({...onboarding, targetWeight: e.target.value === '' ? '' : parseFloat(e.target.value)})} />
                  </div>
                </div>

                <div>
                  <label className="input-label">Primary Goal</label>
                  <select className="form-select" value={onboarding.goal} onChange={e => setOnboarding({...onboarding, goal: e.target.value})}>
                    <option value="Lose Weight">Lose Weight</option>
                    <option value="Gain Weight">Gain Weight</option>
                    <option value="Manage Health Issue">Fit Lifestyle / Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Diet Preference</label>
                  <select className="form-select" value={onboarding.dietPreference || 'Balanced'} onChange={e => setOnboarding({...onboarding, dietPreference: e.target.value})}>
                    <option value="Balanced">Balanced / Non-Veg</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Keto">Keto (Low-Carb, High-Fat)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Update Health Conditions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {['Diabetes', 'BP', 'PCOS', 'Thyroid', 'High Cholesterol'].map(cond => {
                      const isChecked = onboarding.conditions.includes(cond);
                      return (
                        <label key={cond} style={{ 
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                          background: isChecked ? 'var(--primary-glow)' : 'var(--bg-unselected)',
                          border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'}`,
                          borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem'
                        }}>
                          <input 
                            type="checkbox" checked={isChecked} style={{ accentColor: 'var(--primary)' }}
                            onChange={() => {
                              const next = isChecked ? onboarding.conditions.filter(c => c !== cond) : [...onboarding.conditions, cond];
                              setOnboarding({...onboarding, conditions: next});
                            }}
                          />
                          <span style={{ color: 'var(--text-main)' }}>{cond}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="input-label">Food Allergies & Intolerances</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {['Gluten', 'Dairy', 'Peanuts', 'Tree Nuts', 'Shellfish', 'Soy', 'Eggs'].map(allergy => {
                      const currentAllergies = onboarding.allergies ? onboarding.allergies.split(',').map(a => a.trim()).filter(a => a) : [];
                      const isSelected = currentAllergies.includes(allergy);
                      return (
                        <button 
                          key={allergy} 
                          type="button"
                          onClick={() => {
                            let newAllergies = [...currentAllergies];
                            if (isSelected) newAllergies = newAllergies.filter(a => a !== allergy);
                            else newAllergies.push(allergy);
                            setOnboarding({...onboarding, allergies: newAllergies.join(', ')});
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                            background: isSelected ? 'var(--primary-glow)' : 'transparent',
                            color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem'
                          }}
                        >
                          {allergy}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {profileStatusMsg.text && (
                  <div style={{
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: profileStatusMsg.type === 'error' ? 'rgba(255,100,100,0.1)' : 'rgba(100,255,100,0.1)',
                    color: profileStatusMsg.type === 'error' ? '#ff6b6b' : '#4ade80',
                    border: `1px solid ${profileStatusMsg.type === 'error' ? 'rgba(255,100,100,0.2)' : 'rgba(100,255,100,0.2)'}`,
                    marginBottom: '16px',
                    fontSize: '0.9rem'
                  }}>
                    {profileStatusMsg.text}
                  </div>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
                  Update Profile Details
                </button>
              </form>
            </div>
            
            {/* Dark mode & Config key */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3>Interface Theme Settings</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>Appearance Theme</h4>
                  <p style={{ fontSize: '0.8rem' }}>Switch between Sleek Cream (default) and Slate Dark layout themes</p>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ display: 'inline-flex', gap: '8px', padding: '10px 18px' }}
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? (
                    <><Sun size={16} /> Light Theme</>
                  ) : (
                    <><Moon size={16} /> Dark Theme</>
                  )}
                </button>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Translate Dashboard Language</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { code: 'EN', name: 'English' },
                    { code: 'HI', name: 'हिन्दी (Hindi)' },
                    { code: 'TE', name: 'తెలుగు (Telugu)' },
                    { code: 'TA', name: 'தமிழ் (Tamil)' }
                  ].map(lang => (
                    <button 
                      key={lang.code} className="btn"
                      style={{ 
                        background: activeLang === lang.code ? 'var(--primary)' : 'rgba(0,0,0,0.02)',
                        border: activeLang === lang.code ? 'none' : '1px solid var(--border-color)',
                        color: activeLang === lang.code ? '#FFFFFF' : 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      <Globe size={14} /> {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>


            <button className="btn" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }} onClick={handleLogout}>
              Logout Profile
            </button>

          </div>
        )}

      </main>

      {/* Manual Meal Modal */}
      {showAddMealModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-container">
            <h3>Log {selectedMealType} Meal</h3>
            <form onSubmit={handleAddManualMeal} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label className="input-label">Meal Name</label>
                <input type="text" required className="form-input" placeholder="e.g. Oats with Banana" value={manualMeal.name} onChange={e => setManualMeal({...manualMeal, name: e.target.value})} />
              </div>

              <div className="grid-2">
                <div>
                  <label className="input-label">Emoji Icon</label>
                  <input type="text" className="form-input" placeholder="🍛" value={manualMeal.emoji} onChange={e => setManualMeal({...manualMeal, emoji: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Calories (kcal)</label>
                  <input type="number" required className="form-input" placeholder="e.g. 350" value={manualMeal.calories} onChange={e => setManualMeal({...manualMeal, calories: e.target.value})} />
                </div>
              </div>

              <div className="grid-3">
                <div>
                  <label className="input-label">Protein (g)</label>
                  <input type="number" className="form-input" placeholder="g" value={manualMeal.protein} onChange={e => setManualMeal({...manualMeal, protein: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Carbs (g)</label>
                  <input type="number" className="form-input" placeholder="g" value={manualMeal.carbs} onChange={e => setManualMeal({...manualMeal, carbs: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Fats (g)</label>
                  <input type="number" className="form-input" placeholder="g" value={manualMeal.fat} onChange={e => setManualMeal({...manualMeal, fat: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddMealModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Water Preset Modal */}
      {showWaterModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-container">
            <h3>Log Water Intake 💧</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Select a quick container or enter custom Liters below:</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <button 
                className="btn btn-secondary" style={{ padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                onClick={() => { updateWater(0.25); setShowWaterModal(false); }}
              >
                <span style={{ fontSize: '1.6rem' }}>🥛</span>
                <span style={{ fontSize: '9px', marginTop: '4px' }}>Glass (250ml)</span>
              </button>
              <button 
                className="btn btn-secondary" style={{ padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                onClick={() => { updateWater(0.50); setShowWaterModal(false); }}
              >
                <span style={{ fontSize: '1.6rem' }}>🥤</span>
                <span style={{ fontSize: '9px', marginTop: '4px' }}>Large Cup (500ml)</span>
              </button>
              <button 
                className="btn btn-secondary" style={{ padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                onClick={() => { updateWater(0.75); setShowWaterModal(false); }}
              >
                <span style={{ fontSize: '1.6rem' }}>🍾</span>
                <span style={{ fontSize: '9px', marginTop: '4px' }}>Bottle (750ml)</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" step="0.05" className="form-input" placeholder="Custom liters (e.g. 0.45)" 
                value={customWater} onChange={e => setCustomWater(e.target.value)} 
              />
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const val = parseFloat(customWater);
                  if (val > 0) {
                    updateWater(val);
                    setCustomWater('');
                    setShowWaterModal(false);
                  }
                }}
              >
                Log
              </button>
            </div>
            
            <button className="btn-link" style={{ marginTop: '16px', display: 'block', width: '100%', textAlign: 'center' }} onClick={() => setShowWaterModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Average Health Score Coach Modal */}
      {showCoachModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-container">
            <h3>🥦 Dynamic Health Score Coach</h3>
            <p style={{ fontSize: '0.9rem', margin: '8px 0 16px 0', lineHeight: '1.5' }}>
              Your current average rating is <strong>{avgHealth} / 10</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
              {todayMeals.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No meals logged today. Use Scanner to evaluate ingredients and populate ratings.</p>
              ) : (
                todayMeals.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{m.emoji} {m.name || m.food_name}</span>
                    <strong style={{ color: m.healthScore >= 7 ? 'var(--secondary)' : '#F59E0B' }}>{m.healthScore}/10</strong>
                  </div>
                ))
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowCoachModal(false)}>Close Advisor</button>
          </div>
        </div>
      )}

    </div>
  );
}
