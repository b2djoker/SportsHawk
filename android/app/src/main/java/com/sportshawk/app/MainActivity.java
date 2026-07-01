package com.sportshawk.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativePoseDetectionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
