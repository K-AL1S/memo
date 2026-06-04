# No Forget Android

这是把当前网页封装成的 Android 应用工程，使用原生 WebView 加载本地 `assets` 中的 `memo.html`。任务数据仍保存在手机本机的 WebView 存储中。

## 打包 APK

1. 用 Android Studio 打开 `android-app` 文件夹。
2. 等待 Gradle 同步完成。
3. 选择 `Build > Build Bundle(s) / APK(s) > Build APK(s)`。
4. 将生成的 APK 复制到华为手机并安装。

如果命令行环境已安装 Android SDK 和 Gradle，也可以在本目录运行：

```powershell
gradle assembleDebug
```

生成文件通常位于：

```text
app/build/outputs/apk/debug/app-debug.apk
```
