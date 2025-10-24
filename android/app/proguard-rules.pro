# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# =============================================================================
# GENERAL ANDROID RULES
# =============================================================================

# Keep all classes with native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep all enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# =============================================================================
# ANDROIDX BROWSER HELPER (TWA) RULES
# =============================================================================

# Keep AndroidX Browser Helper classes
-keep class androidx.browser.** { *; }
-keep class com.google.androidbrowserhelper.** { *; }

# Keep TWA related classes
-keep class com.google.androidbrowserhelper.trusted.** { *; }
-keep class androidx.browser.customtabs.** { *; }

# Digital Asset Links verification
-keep class com.google.androidbrowserhelper.trusted.TwaLauncher { *; }
-keep class com.google.androidbrowserhelper.trusted.LauncherActivity { *; }

# Custom Tabs Service
-keep class androidx.browser.customtabs.CustomTabsService { *; }
-keep class androidx.browser.customtabs.CustomTabsServiceConnection { *; }

# =============================================================================
# MATERIAL DESIGN COMPONENTS
# =============================================================================

# Keep Material Design Components
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**

# Keep Material Design theme attributes
-keep class * extends com.google.android.material.theme.** { *; }

# =============================================================================
# ANDROIDX CORE AND APPCOMPAT
# =============================================================================

# Keep AndroidX Core classes
-keep class androidx.core.** { *; }
-keep class androidx.appcompat.** { *; }

# Keep Activity and Fragment classes
-keep class androidx.activity.** { *; }
-keep class androidx.fragment.** { *; }

# Keep Lifecycle components
-keep class androidx.lifecycle.** { *; }

# =============================================================================
# SPLASH SCREEN API
# =============================================================================

# Keep Splash Screen API classes
-keep class androidx.core.splashscreen.** { *; }

# =============================================================================
# MULTIDEX SUPPORT
# =============================================================================

# Keep MultiDex classes
-keep class androidx.multidex.** { *; }
-keep class android.support.multidex.** { *; }

# =============================================================================
# SECURITY AND CRYPTO
# =============================================================================

# Keep AndroidX Security classes
-keep class androidx.security.crypto.** { *; }

# =============================================================================
# WORK MANAGER
# =============================================================================

# Keep Work Manager classes
-keep class androidx.work.** { *; }
-keep class * extends androidx.work.Worker
-keep class * extends androidx.work.ListenableWorker { *; }

# =============================================================================
# KOTLIN SPECIFIC RULES
# =============================================================================

# Keep Kotlin metadata
-keep class kotlin.Metadata { *; }

# Keep Kotlin coroutines
-keepclassmembers class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# Keep Kotlin standard library
-keep class kotlin.** { *; }

# =============================================================================
# GSON RULES
# =============================================================================

# Keep Gson classes
-keep class com.google.gson.** { *; }
-keep class sun.misc.Unsafe { *; }

# Keep generic type information for Gson
-keepattributes Signature
-keepattributes *Annotation*

# Keep model classes for JSON serialization
-keep class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# =============================================================================
# OKHTTP RULES
# =============================================================================

# Keep OkHttp classes
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# =============================================================================
# GLIDE RULES
# =============================================================================

# Keep Glide classes
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule {
    <init>(...);
}
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
    **[] $VALUES;
    public *;
}
-keep class com.bumptech.glide.load.data.ParcelFileDescriptorRewinder$InternalRewinder {
    *** rewind();
}

# =============================================================================
# WEB VIEW RULES (for TWA)
# =============================================================================

# Keep WebView related classes
-keep class android.webkit.** { *; }
-keep class android.webkit.JavascriptInterface { *; }

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# =============================================================================
# REFLECTION RULES
# =============================================================================

# Keep classes that use reflection
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# =============================================================================
# OPTIMIZATION RULES
# =============================================================================

# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Remove debug code
-assumenosideeffects class * {
    void debug(...);
    void trace(...);
}

# =============================================================================
# CUSTOM APPLICATION RULES
# =============================================================================

# Keep Application class
-keep class org.shelfquest.app.** { *; }

# Keep any custom classes that might be referenced dynamically
-keep class * extends android.app.Application { *; }

# Keep manifest placeholders and build config
-keep class **.BuildConfig { *; }

# =============================================================================
# NOTIFICATION RULES
# =============================================================================

# Keep notification related classes
-keep class androidx.core.app.NotificationCompat** { *; }
-keep class android.app.Notification** { *; }

# =============================================================================
# FILE PROVIDER RULES
# =============================================================================

# Keep FileProvider classes
-keep class androidx.core.content.FileProvider { *; }
-keep class * extends androidx.core.content.FileProvider { *; }

# =============================================================================
# PREFERENCE RULES
# =============================================================================

# Keep Preference classes
-keep class androidx.preference.** { *; }

# =============================================================================
# NAVIGATION COMPONENT RULES
# =============================================================================

# Keep Navigation Component classes
-keep class androidx.navigation.** { *; }

# =============================================================================
# DISABLE WARNINGS FOR OPTIONAL DEPENDENCIES
# =============================================================================

-dontwarn javax.annotation.**
-dontwarn javax.inject.**
-dontwarn sun.misc.Unsafe
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement

# Google Tink optional dependencies (used by androidx.security:security-crypto)
-dontwarn com.google.api.client.http.GenericUrl
-dontwarn com.google.api.client.http.HttpHeaders
-dontwarn com.google.api.client.http.HttpRequest
-dontwarn com.google.api.client.http.HttpRequestFactory
-dontwarn com.google.api.client.http.HttpResponse
-dontwarn com.google.api.client.http.HttpTransport
-dontwarn com.google.api.client.http.javanet.NetHttpTransport$Builder
-dontwarn com.google.api.client.http.javanet.NetHttpTransport
-dontwarn org.joda.time.Instant

# =============================================================================
# ADDITIONAL OPTIMIZATION
# =============================================================================

# Moderate optimization (less aggressive to prevent R8 failures)
-allowaccessmodification
# -mergeinterfacesaggressively (disabled - can cause issues with TWA)
# -overloadaggressively (disabled - can cause issues with reflection)
-repackageclasses ''

# Optimize for size with safer settings
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*
-optimizationpasses 3

# =============================================================================
# DEBUG INFORMATION
# =============================================================================

# Keep source file names and line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable

# Rename source file attribute to hide the real source file name
-renamesourcefileattribute SourceFile
