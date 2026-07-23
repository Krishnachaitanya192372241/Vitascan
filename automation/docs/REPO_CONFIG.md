# Repository Configuration Guide

This guide details repository configurations required to support automated pages deployment and artifact uploads.

## Enable GitHub Pages
1. Go to your GitHub repository dashboard.
2. Select **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions** from the dropdown menu.
4. The workflow will now automatically publish reports to `https://<github-username>.github.io/<repository-name>/`.

## Configure Workflow Permissions
1. Select **Settings** -> **Actions** -> **General**.
2. Scroll to **Workflow permissions**.
3. Select **Read and write permissions** and click **Save**. This allows the deployment task to write Pages artifacts.
