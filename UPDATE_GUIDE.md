# SuperRez Update Guide

**Current Version:** 0.2.0 (Phase 4.4 - Kimi K2 Integration)  
**Last Updated:** 2025-07-22

## 🔄 Current Update Process

### **Important:** Manual Installation Required

SuperRez is **not yet published to the VSCode Marketplace**, which means updates must be installed manually on each computer. The extension cannot auto-update like marketplace extensions.

## 📦 How to Update SuperRez

### **Step 1: Get the Latest Version**

**Option A: Download from GitHub**
1. Visit [SuperRez Releases](https://github.com/rezurx/SuperRez/releases)
2. Download the latest `superrez-X.X.X.vsix` file
3. Transfer to your target computer

**Option B: Build from Source**
```bash
git clone https://github.com/rezurx/SuperRez.git
cd SuperRez
npm install
npm run compile
vsce package
```

### **Step 2: Uninstall Old Version**
1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Find "SuperRez" in installed extensions
4. Click the gear icon → "Uninstall"
5. Restart VSCode (recommended)

### **Step 3: Install New Version**
1. Open Command Palette (Ctrl+Shift+P)
2. Type: `Extensions: Install from VSIX...`
3. Navigate to and select your `superrez-X.X.X.vsix` file
4. Click "Install"
5. Restart VSCode to activate new features

### **Step 4: Verify Installation**
1. Open Command Palette (Ctrl+Shift+P)
2. Type: `SuperRez: Show Status`
3. Confirm version shows as latest (v0.2.0+)
4. Test: `SuperRez: Show AI Tools` to verify Kimi K2 support

## 🆕 What's New in v0.2.0

### **Kimi K2 Integration**
- **8+ AI Tools**: Now supports Claude, Gemini, Copilot, Ollama, Kimi K2, Cursor, Local AI
- **Smart Routing**: Kimi K2 prioritized for analysis and code generation tasks
- **Competitive Pricing**: $0.0015/1K tokens (50% cheaper than Claude)
- **Global Access**: International AI capability via Moonshot platform

### **Enhanced Features**
- **Multi-AI Teams**: Kimi K2 available for engineering agent roles
- **Cost Optimization**: Maintains 95% cost reduction with new AI option  
- **Production Ready**: Comprehensive testing and documentation
- **Setup Guide**: Full Kimi K2 configuration instructions

## ⚙️ Kimi K2 Setup (New in v0.2.0)

If you want to enable the new Kimi K2 integration:

1. **Get API Key**: Visit [Moonshot AI Console](https://platform.moonshot.ai/console/api-keys)
2. **Set Environment Variable**:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export MOONSHOT_API_KEY="your-api-key-here"
   ```
3. **Restart Terminal/VSCode**: To load new environment variable
4. **Verify Detection**: Run `SuperRez: Show AI Tools` to confirm Kimi K2 is detected

## 📍 Multiple Computer Management

### **For Development Teams:**
1. **Shared VSIX Distribution**: Store latest VSIX in shared location
2. **Version Tracking**: Keep changelog of which computers have which version
3. **Update Schedule**: Coordinate team updates for consistency

### **For Personal Use:**
1. **Cloud Storage**: Keep latest VSIX in Dropbox/Google Drive
2. **Update Checklist**: Track which devices need updating
3. **Feature Testing**: Verify features work on each computer after update

## 🔄 Version History

| Version | Date | Key Features |
|---------|------|--------------|
| **0.2.0** | 2025-07-22 | **Kimi K2 Integration**, 8+ AI tools, enhanced multi-AI teams |
| 0.1.0 | 2025-07-19 | Local AI integration, consensus engine, template generation |

## 🚀 Future Update Methods (Roadmap)

### **Phase 5: Automatic Updates**

**Option 1: VSCode Marketplace (Recommended)**
- ✅ **Automatic Updates**: Users get updates via VSCode's built-in system
- ✅ **Professional Distribution**: Official marketplace presence
- ✅ **Version Management**: Automatic rollback support
- ✅ **User Discovery**: Searchable in VSCode Extensions

**Option 2: GitHub Releases + Notifications**
- ✅ **Release Automation**: Auto-generate VSIX on git tags
- ✅ **Update Notifications**: Extension checks for newer versions
- ✅ **Download Links**: Direct links to latest VSIX
- ❌ **Manual Installation**: Still requires VSIX installation

**Option 3: Custom Update System**
- ✅ **In-Extension Updates**: Download and install within VSCode
- ✅ **Seamless Experience**: No manual VSIX handling
- ❌ **Complex Implementation**: Significant development overhead

### **Phase 5: SuperRez CLI**
- **Universal Distribution**: npm, homebrew, chocolatey packages
- **Automatic Updates**: Standard package manager update flows
- **Cross-Platform**: Works outside VSCode on any terminal

## 🛠️ Troubleshooting Updates

### **Common Issues:**

**Issue: "Extension not found" after update**
- **Solution**: Restart VSCode completely (close all windows)
- **Alternative**: Reload window (Ctrl+Shift+P → "Developer: Reload Window")

**Issue: "Commands not appearing in palette"**
- **Solution**: Check extension is enabled in Extensions tab
- **Debug**: Look for errors in Developer Console (Help → Toggle Developer Tools)

**Issue: "Old version features still active"**
- **Solution**: Ensure old version was fully uninstalled before installing new
- **Reset**: Clear extension data (rare cases)

**Issue: "Kimi K2 not detected" (v0.2.0)**
- **Solution**: Verify `MOONSHOT_API_KEY` environment variable is set
- **Test**: Run `echo $MOONSHOT_API_KEY` in terminal
- **Reload**: Restart VSCode after setting environment variables

### **Support:**
- **GitHub Issues**: [Report problems](https://github.com/rezurx/SuperRez/issues)
- **Discord**: #superrez channel for community support
- **Documentation**: Check README.md for feature details

## 📋 Update Checklist

### **Before Updating:**
- [ ] Backup current SuperRez settings (if customized)
- [ ] Note current version number
- [ ] Close all VSCode windows

### **During Update:**
- [ ] Uninstall old version completely
- [ ] Restart VSCode
- [ ] Install new VSIX file
- [ ] Restart VSCode again

### **After Update:**
- [ ] Verify version with `SuperRez: Show Status`
- [ ] Test core commands work
- [ ] Configure new features (e.g., Kimi K2)
- [ ] Update other computers in your environment

## 🎯 Current Status: Manual Updates Required

**Until VSCode Marketplace publication**, SuperRez requires manual distribution and installation. This ensures you have the latest features but requires coordination across multiple computers.

**Next Phase**: Marketplace publication will enable automatic updates for all users, making SuperRez as easy to update as any other VSCode extension.

---

**Questions?** Open an issue on [GitHub](https://github.com/rezurx/SuperRez/issues) or check our [Discord](https://discord.gg/superrez) community.