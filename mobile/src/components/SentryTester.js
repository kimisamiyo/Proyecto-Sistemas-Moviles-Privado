// components/SentryTester.js
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import * as Sentry from "@sentry/react-native";

export default function SentryTester() {
  const sendInfo = () => {
    Sentry.addBreadcrumb({
      category: "app",
      message: "Application started",
      level: "info",
    });
    Sentry.logger.info("Application started");
  };

  const sendWarning = () => {
    Sentry.addBreadcrumb({
      category: "network",
      message: "Slow network detected (>3s)",
      level: "warning",
    });
    Sentry.logger.warn("Slow network detected (>3s)");
  };

  const sendError = () => {
    try {
      throw new Error("Simulated error for testing Sentry");
    } catch (e) {
      Sentry.captureException(e);
    }
  };

  const sendDebug = () => {
    Sentry.setContext("cart", { items: 3, total: 45.0 });
    Sentry.logger.debug("Redux action: ADD_TO_CART");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.btn, styles.info]} onPress={sendInfo}>
        <Text style={styles.label}>Info</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.warning]}
        onPress={sendWarning}
      >
        <Text style={styles.label}>Warning</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.error]} onPress={sendError}>
        <Text style={styles.label}>Error</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.debug]} onPress={sendDebug}>
        <Text style={styles.label}>Debug</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  info: { backgroundColor: "#185FA5" },
  warning: { backgroundColor: "#BA7517" },
  error: { backgroundColor: "#A32D2D" },
  debug: { backgroundColor: "#5F5E5A" },
});
