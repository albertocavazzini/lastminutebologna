import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

const INJECT_ERR_BRIDGE = `
(function(){
  try {
    window.addEventListener('error', function(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('WIN_ERR:' + (e.message || e.error) + ' @' + (e.lineno || '?'));
      }
    });
    window.addEventListener('unhandledrejection', function(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('PROMISE:' + String(e.reason));
      }
    });
  } catch (e) {}
})();
true;
`;

function hostForVite(): string {
  const dbg = Constants.expoGoConfig?.debuggerHost;
  if (dbg) {
    const host = dbg.split(":")[0]?.trim();
    if (
      host &&
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      host !== "[::1]"
    ) {
      return host;
    }
  }
  if (Platform.OS === "android") return "10.0.2.2";
  return "127.0.0.1";
}

function resolveViteUrl(): string {
  const env = process.env.EXPO_PUBLIC_VITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return `http://${hostForVite()}:8080`;
}

export default function App() {
  const uri = useMemo(() => `${resolveViteUrl()}/`, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diag, setDiag] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const readyRef = useRef(false);

  const pushDiag = useCallback((line: string) => {
    setDiag((d) => [...d.slice(-12), line]);
  }, []);

  useEffect(() => {
    readyRef.current = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      if (!readyRef.current) {
        setLoading(false);
        setError(
          "L’app web non ha confermato il caricamento entro 20s.\n\n" +
            "1) Nella root FlashDrop: VITE_SKIP_LOVABLE_TAGGER=1 nel file .env\n" +
            "2) Riavvia `npm run dev`\n" +
            "3) Controlla i messaggi qui sotto (WIN_ERR / ROOT_ERROR).",
        );
      }
    }, 20_000);
    return () => clearTimeout(t);
  }, [reloadKey]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      const data = event.nativeEvent.data;
      if (data === "FLASHDROP_READY") {
        readyRef.current = true;
        setLoading(false);
        setError(null);
        pushDiag("FLASHDROP_READY");
        return;
      }
      if (data.startsWith("ROOT_ERROR:")) {
        readyRef.current = true;
        setLoading(false);
        setError(data.slice("ROOT_ERROR:".length).trim());
        pushDiag(data.slice(0, 120));
        return;
      }
      if (data.startsWith("WIN_ERR:") || data.startsWith("PROMISE:")) {
        pushDiag(data);
        return;
      }
    },
    [pushDiag],
  );

  const handleError = useCallback(
    (e: { nativeEvent: { description?: string } }) => {
      setLoading(false);
      const desc = e.nativeEvent.description;
      setError(
        desc ||
          "Impossibile caricare la pagina. Avvia `npm run dev` nella root FlashDrop (porta 8080).",
      );
    },
    [],
  );

  const handleHttpError = useCallback(
    (event: { nativeEvent: { statusCode: number; description: string } }) => {
      setLoading(false);
      const { statusCode, description } = event.nativeEvent;
      if (statusCode >= 400) {
        setError(
          `HTTP ${statusCode}${description ? ` — ${description}` : ""}\n\n` +
            "Vite non risponde su questa URL. Verifica `npm run dev` e la porta 8080.",
        );
      }
    },
    [],
  );

  const reload = useCallback(() => {
    setDiag([]);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  const openSafari = useCallback(() => {
    Linking.openURL(uri).catch(() => {});
  }, [uri]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <WebView
        key={reloadKey}
        source={{ uri }}
        style={styles.webview}
        onLoadStart={() => {
          setError(null);
        }}
        onMessage={handleMessage}
        onError={handleError}
        onHttpError={handleHttpError}
        injectedJavaScriptBeforeContentLoaded={INJECT_ERR_BRIDGE}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={["*"]}
        pullToRefreshEnabled
        cacheEnabled={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        webviewDebuggingEnabled={__DEV__}
        {...(Platform.OS === "android"
          ? { mixedContentMode: "always" as const }
          : {})}
      />

      {loading && !error && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#FF7E5F" />
          <Text style={styles.hint}>In attesa dell’app…</Text>
          <Text style={styles.mono}>{uri}</Text>
          <Text style={styles.subhint}>
            FlashDrop: npm run dev + .env con VITE_SKIP_LOVABLE_TAGGER=1
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Non si carica</Text>
          <ScrollView style={styles.errorScroll}>
            <Text style={styles.errorText}>{error}</Text>
          </ScrollView>
          <Text style={styles.mono}>{uri}</Text>
          {diag.length > 0 && (
            <ScrollView style={styles.diagScroll}>
              <Text style={styles.diagTitle}>Log pagina</Text>
              {diag.map((line, i) => (
                <Text key={i} style={styles.diagLine}>
                  {line}
                </Text>
              ))}
            </ScrollView>
          )}
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={reload}>
              <Text style={styles.buttonText}>Riprova</Text>
            </Pressable>
            <Pressable style={styles.buttonSecondary} onPress={openSafari}>
              <Text style={styles.buttonSecondaryText}>Apri in Safari</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F7F7" },
  webview: { flex: 1, backgroundColor: "#F7F7F7" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247,247,247,0.94)",
  },
  hint: {
    marginTop: 16,
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: "600",
    color: "#484848",
    textAlign: "center",
  },
  mono: {
    marginTop: 8,
    paddingHorizontal: 16,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#666",
    textAlign: "center",
  },
  subhint: {
    marginTop: 12,
    paddingHorizontal: 28,
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    lineHeight: 16,
  },
  errorBox: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    paddingTop: 56,
    backgroundColor: "#F7F7F7",
  },
  errorScroll: { maxHeight: 160, marginBottom: 8 },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#484848",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },
  diagScroll: {
    maxHeight: 120,
    marginTop: 8,
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  diagTitle: { fontSize: 11, fontWeight: "700", marginBottom: 4, color: "#555" },
  diagLine: {
    fontSize: 10,
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 2,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  button: {
    backgroundColor: "#FF7E5F",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  buttonSecondaryText: { color: "#484848", fontWeight: "600", fontSize: 15 },
});
