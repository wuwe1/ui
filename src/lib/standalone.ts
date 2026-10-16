// 从主屏幕打开的（iOS「添加到主屏幕」、装成 App 的 PWA）：没有地址栏，屏幕边缘的手势归系统（抽屉的手势要让开，lib/drawer.ts）
export const standalone =
	typeof window !== "undefined" && (matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
