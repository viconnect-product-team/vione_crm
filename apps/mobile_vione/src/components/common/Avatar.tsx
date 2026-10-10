import React, { useState } from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "../../theme/colors";
import { resolveMediaUrl } from "../../utils/media";

interface AvatarProps {
  url?: string | null;
  name?: string;
  size?: number;
  showGoldBorder?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name = "ViOne",
  size = 48,
  showGoldBorder = true,
  style,
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "VO";

  const resolvedUrl = resolveMediaUrl(url);
  const hasImage = !imgError && !!resolvedUrl;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: showGoldBorder ? Colors.gold : Colors.surfaceBorder,
          borderWidth: showGoldBorder ? 1.5 : 1,
        },
        style,
      ]}
    >
      {hasImage ? (
        <Image
          source={{ uri: resolvedUrl! }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text
            style={[
              styles.initials,
              { fontSize: size * 0.38, color: Colors.goldLight },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceElevated,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.navyDark,
  },
  initials: {
    fontWeight: "700",
  },
});
