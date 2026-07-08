import { useWindowDimensions, type TextStyle } from "react-native";
import RenderHTML from "react-native-render-html";

interface HTMLDescriptionProps {
  html: string | null | undefined;
  style?: TextStyle;
  numberOfLines?: number;
  contentWidth?: number;
}

export default function HTMLDescription({ html, style, numberOfLines, contentWidth }: HTMLDescriptionProps) {
  const { width } = useWindowDimensions();

  if (!html) return null;

  return (
    <RenderHTML
      contentWidth={contentWidth ?? width - 32}
      source={{ html }}
      baseStyle={{ ...(style as any), margin: 0, padding: 0 }}
      defaultTextProps={{ numberOfLines }}
      enableExperimentalMarginCollapsing={true}
    />
  );
}
