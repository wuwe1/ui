// 点开一个小面板：电脑上是贴着按钮的浮层（Popover），手机上从下面出来、整屏宽（Sheet）。上面一行标题，可带一句说明
import type { ComponentProps, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.tsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet.tsx";
import { useSidebar } from "./sidebar.tsx";
import { cn } from "../lib/utils.ts";

/**
 * trigger 是按钮本身（自己会开关，不用另写 onClick；它的 onClick 里 preventDefault 就不开关）；
 * className、contentProps 只给电脑上的浮层：宽、最大高度；指着就开的那种（目录）要的指针进出、不抢焦点
 */
export function Popsheet({ trigger, title, description, side, align, open, onOpenChange, className, contentProps, children }: {
	trigger: ReactNode;
	title: string;
	description?: string;
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
	open?: boolean;
	onOpenChange?: (o: boolean) => void;
	className?: string;
	contentProps?: Omit<ComponentProps<typeof PopoverContent>, "children" | "className" | "side" | "align">;
	children: ReactNode;
}) {
	// 和侧栏用同一个判断（已经算好了，不会先画成浮层再换）
	const { isMobile } = useSidebar();
	if (isMobile)
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetTrigger asChild>{trigger}</SheetTrigger>
				<SheetContent side="bottom" className="max-h-[85svh] gap-0 pb-[max(1rem,env(safe-area-inset-bottom))]" {...(description ? {} : { "aria-describedby": undefined })}>
					<SheetHeader>
						<SheetTitle>{title}</SheetTitle>
						{description && <SheetDescription>{description}</SheetDescription>}
					</SheetHeader>
					<div className="overflow-y-auto px-4">{children}</div>
				</SheetContent>
			</Sheet>
		);
	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent side={side} align={align} className={cn("overflow-y-auto p-3", className)} {...contentProps}>
				{/* 内容长、滚着看时标题留在顶上 */}
				<div className="sticky -top-3 z-10 -mx-3 -mt-3 flex flex-col gap-0.5 bg-popover px-3 pt-3 pb-1">
					<span className="text-sm font-medium">{title}</span>
					{description && <span className="text-xs text-muted-foreground">{description}</span>}
				</div>
				{children}
			</PopoverContent>
		</Popover>
	);
}
