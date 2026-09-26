import { Text } from "react-native";

export type SymbolViewProps = { name: unknown; fallback?: React.ReactNode; [key: string]: unknown };

export function SymbolView({ fallback }: SymbolViewProps): React.ReactNode {
  return fallback ?? <Text>•</Text>;
}
