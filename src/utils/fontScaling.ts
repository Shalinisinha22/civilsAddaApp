import { Text, TextInput } from 'react-native';

type FontScaledComponent = { defaultProps?: { allowFontScaling?: boolean } };

export function disableSystemFontScaling(): void {
  (Text as unknown as FontScaledComponent).defaultProps = {
    ...(Text as unknown as FontScaledComponent).defaultProps,
    allowFontScaling: false,
  };
  (TextInput as unknown as FontScaledComponent).defaultProps = {
    ...(TextInput as unknown as FontScaledComponent).defaultProps,
    allowFontScaling: false,
  };
}
