package org.shelfquest.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Enable edge-to-edge display so the WebView extends behind
        // the system status bar and navigation bar. The web app uses
        // env(safe-area-inset-*) CSS to avoid overlapping system UI.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
