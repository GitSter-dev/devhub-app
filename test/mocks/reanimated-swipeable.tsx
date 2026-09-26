import { useImperativeHandle, type ReactNode, type Ref } from "react";

export type SwipeableMethods = { close: () => void; openLeft: () => void; openRight: () => void; reset: () => void };

type Props = { children?: ReactNode; ref?: Ref<SwipeableMethods>; [key: string]: unknown };

export default function ReanimatedSwipeable({ children, ref }: Props): ReactNode {
  useImperativeHandle(ref, () => ({ close: () => {}, openLeft: () => {}, openRight: () => {}, reset: () => {} }));
  return children;
}
