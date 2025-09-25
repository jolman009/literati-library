### Literature Platform – Production Readiness Review (September 2025)

## Project overview
# Literati is a digital bookshelf application enabling users to upload, read and manage e-books and documents. It consists of:


2 Front‑end assessment
Production readiness
Progressive Web App configuration – The manifest defines a standalone PWA with proper icons, categories and shortcuts. The service worker uses Workbox to cache API responses, PDFs, images and JS/CSS assets, ensuring offline support and performance. This meets Google’s PWA installability requirements (HTTPS, service worker and manifest). The manifest includes screenshots and a maskable icon; this is required for store listings.


Deployment environment – The vite.config.mjs sets build.sourcemap for debugging and splits vendor chunks for better load time. However, the client uses a hard‑coded check on window.location.hostname to decide whether to hit the local or production API. This prevents using dynamic environments (e.g. staging) and makes the code less maintainable. Recommendation: move API base URLs to environment variables (.env and import.meta.env) and inject them at build time; this also simplifies packaging into native wrappers.


Security & error handling – Axios interceptors add a Bearer token from localStorage and handle 401 responses. Authentication tokens stored in localStorage can be exposed via XSS; consider HttpOnly cookies or secure storage on mobile. The client logs errors but does not implement a central error boundary or crash reporting; integrating a service like Sentry would be beneficial.


Testing & linting – The project has unit and end‑to‑end test scripts (Vitest and Playwright) defined in package.json. Running and enforcing these tests before release will increase confidence. There is ESLint configuration, but CI integration is not visible; ensure automated pipelines run tests and linting on each commit.


Accessibility & localisation – Material UI and Tailwind are used, but there is no mention of ARIA labels. The manifest sets language to English; if the target audience is broader, i18n should be considered. Evaluate components with screen‑reader tools and adjust focus management.


CI/CD & hosting – Not visible in the repository. A pipeline should build the client, run tests, generate a PWA (dist folder) and deploy to a CDN (e.g. Vercel, Netlify) using a domain with HTTPS. For TWA, the domain must support .well‑known/assetlinks.json.


Required actions for App Store / Windows store
Universal Links / Deep Links – For iOS, if you plan to wrap the PWA into a native container, set up apple‑app‑site‑association files to support universal links; this is analogous to Digital Asset Links on Android. The PWA should implement deep links for books, uploads and notes. Without universal links, Apple may reject the app for being a “wrapper” of a website.


App Store Guidelines – Apple prohibits apps that are primarily websites unless they provide native functionality. To meet guideline 4.2, consider building a thin native wrapper using Capacitor or React Native WebView that integrates features like push notifications (via APNs), offline downloads and perhaps an e‑book reader using WebView. This wrapper would share code with the PWA but deliver a more native experience. Add support for “Sign in with Apple” if you have third‑party sign‑ins.


Microsoft Store – Microsoft accepts PWAs packaged as MSIX. You can use PWABuilder to convert the current PWA into a Windows app; it automatically generates a Windows package and injects the manifest and service worker. Ensure the manifest includes shortcuts and display set to standalone. Provide Windows store assets (Store logo, square44x44 icon, wide310x150 image). Also, publish the MSIX through a developer account and complete the age‑rating questionnaire.


3 Back‑end assessment
API structure – The server uses modular Express routes. JWT authentication ensures that endpoints are protected; new users are hashed with bcrypt and stored in Supabase. The routes sanitise inputs and handle errors with descriptive responses. There is a health endpoint for monitoring.


Environment & deployment – A Dockerfile sets up a Node 20 base image, installs dependencies and starts the server with dumb‑init. It exposes port 5000 and includes a health check. The server expects environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, etc.) and fails early if they are missing.


Performance & optimisation – The books route uses a dbOptimizer service to apply caching and query optimisation; performance metrics are returned in development mode. Background tasks (cover fetching) are offloaded using setTimeout to avoid blocking API responses.


Security considerations –


CORS is configured to allow the production domain and local hosts. However, there is no rate limiting or brute‑force protection; adding middleware such as express‑rate‑limit would mitigate abuse.


Sensitive keys – The service role key for Supabase has full privileges. Ensure it is used only on the server (never exposed to the client) and rotated periodically. For client‑side Supabase interactions (if any), use an anonymous public key with row‑level security.


Data validation – Some routes check fields but rely on Supabase to reject invalid columns. A schema validation library (e.g. Joi/Zod) can improve reliability.


Scalability – The server runs as a single Node process. For production, consider containerising and deploying behind a reverse proxy (e.g. Nginx) with auto‑scaling. Logging should be centralised (e.g. CloudWatch, Loggly), and metrics exported (CPU, memory, request latency). Use environment variables for database pool sizes and caching.


4 Android Play Store readiness
The Android Deployment Guide describes a complete process for turning the PWA into a compliant Android app. Key items are:
Prerequisites & environment – Install JDK 17+, Android Studio and SDK 34. Build tools and Gradle version are specified.


Keystore & gradle.properties – Use provided scripts to generate a production keystore and create a gradle.properties file containing the PWA URL, package name and keystore credentials. Do not commit these secrets; store them securely.


Digital Asset Links – Deploy an assetlinks.json file at /.well‑known/assetlinks.json on the PWA domain and include the SHA256 fingerprint of your keystore. Verify with Google’s tool.


Building – Use ./gradlew assembleRelease to generate an APK or bundleRelease to produce an AAB for Play Store submission. The project defines debug, staging and release build variants.


Store listing – Provide app title, short and full description and upload required assets (icon, feature graphic, screenshots). Complete content rating, privacy policy and data safety declaration.


Target SDK & compliance – The app targets API 34 and meets granular permissions and background activity restrictions. It supports splash screen API, predictive back gestures, dynamic colors and large‑screen support. Code shrinking and resource optimisation are enabled.


Testing & monitoring – The guide emphasises automated tests, device testing across API levels 24‑34 and performance testing. Crash reporting via Play Console should be monitored after launch.


Remaining gaps for Android deployment
Token storage – The front‑end uses localStorage for JWTs, which is acceptable in a PWA but insecure on Android if WebView caches it. The TWA environment cannot access cookies, so localStorage is the only option; mitigate by shortening token expiry and implementing refresh tokens.


Offline behaviour – The service worker caches API responses, but interactive operations (book uploads, note edits) will fail offline. Consider queueing operations and retrying when online.


Notification support – The PWA does not implement web push notifications or badges. To increase engagement, implement push notifications via Firebase Cloud Messaging and integrate with TWA using a native service.


Accessibility & translations – Ensure that the PWA meets accessibility guidelines and consider localising the store listing and in‑app texts.


Monetisation – If the app will include in‑app purchases or subscriptions, integrate Google Play Billing and handle revenue share. The current code has no IAP implementation.


5 iOS / Apple App Store considerations
There is no dedicated iOS project in the current repositories. iOS does not support Trusted Web Activities; options are:
Distribute as a PWA – Safari on iOS allows users to “Add to Home Screen”, and your PWA already includes a proper manifest and offline support. However, PWA features on iOS are limited (no push notifications, limited storage). It also does not provide App Store exposure.


Create a native wrapper – Use Capacitor or React Native to wrap the PWA in a native app. Capacitor allows you to embed a WebView and access native plugins (e.g. file system, push notifications). Steps:


Initialise a Capacitor project and add the existing React build output to the iOS project.


Configure Info.plist with the app’s name, icons, splash screens and ATS (App Transport Security) exceptions for your API domain.


Implement native features that are absent in the PWA: push notifications via APNs, offline file access, caching and optional offline reading of books.


Provide a sign‑in mechanism that conforms to Apple’s guidelines, including Sign in with Apple if you offer account creation.


Create a developer account and generate provisioning profiles and certificates. Build with Xcode targeting the latest iOS SDK.


Upload the build as an IPA via App Store Connect; complete App Store listing (metadata, privacy policy, age rating) and pass App Review.


Meet App Store guidelines – Apple often rejects apps that merely wrap a website. To justify presence in the App Store, emphasise native integrations such as offline book downloads, push notifications, system‑wide search (CoreSpotlight) or widgets. Ensure the app does not require external sign‑ups or purchases outside of Apple’s IAP system.


6 Windows Store deployment
The project currently lacks a Windows (UWP or MSIX) package. Windows supports publishing PWAs through the Microsoft Store. Recommended steps:
Use PWABuilder – Go to pwabuilder.com, enter your PWA URL and generate a Windows package. The tool will extract the manifest (requires display: "standalone" and valid icons) and create an MSIX package.


Adjust the manifest – Ensure your manifest.json includes Windows‑specific metadata such as screenshots and categories, which are already present. Provide additional store assets (Windows Store logo 24 x 24 px, wide logo 310 x 150 px). If you want to integrate Windows features like Live Tiles or notifications, consider using Windows Notification Services via a small native wrapper.


Testing – Test the generated MSIX on Windows 10/11 using the Microsoft Store’s AppInstaller or by sideloading. Validate installation, offline behaviour and deep link handling.


Publish – Create a Microsoft Partner account, submit the package via the Microsoft Partner Center, complete the content rating and data safety forms, and wait for certification.


7 Summary of recommended next steps
Complete missing documentation – Provide README files for each repository with instructions for installation, development, environment variables and contribution guidelines.


Parameterise API URLs – Replace hard‑coded host checks in the client with environment variables to simplify deployment across staging and production.


Set up CI/CD – Create a pipeline that builds the client, runs unit and E2E tests, lints code, performs security scanning (e.g. npm audit) and deploys to a staging environment.


Enhance security – Implement rate limiting on the server, switch to HttpOnly cookies or secure storage for tokens, and integrate a logging/monitoring service for errors and anomalies.


Prepare for Google Play – Follow the Android deployment guide: generate keystores, configure gradle.properties, upload assetlinks.json, build the AAB and prepare store assets and privacy declarations.


Develop iOS app – Choose Capacitor/React Native to wrap the PWA, add native features and meet App Store guidelines. Use Apple Developer tools for building and distribution.


Build Windows package – Use PWABuilder to produce an MSIX for the Microsoft Store; supply assets and metadata accordingly.


By following these recommendations and addressing the highlighted areas, the Literati project will be positioned for a successful launch across the Google Play Store, Apple App Store and Microsoft Store.

