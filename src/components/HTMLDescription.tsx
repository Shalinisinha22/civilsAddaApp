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

  // If the content is plain text with newlines (doesn't have block tags or explicit br tags),
  // convert newlines to <br /> so they render as line breaks in HTML.
  const hasHtmlFormatting = /<p|<div|<br|<ol|<ul|<li|<h[1-6]/i.test(html);
  const processedHtml = hasHtmlFormatting ? html : html.replace(/\r?\n/g, '<br />');

  return (
    <RenderHTML
      contentWidth={contentWidth ?? width - 32}
      source={{ html: processedHtml }}
      baseStyle={{ ...(style as any), margin: 0, padding: 0 }}
      defaultTextProps={{ numberOfLines }}
      enableExperimentalMarginCollapsing={true}
    />
  );
}
