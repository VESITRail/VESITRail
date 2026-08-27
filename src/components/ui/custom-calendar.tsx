"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getDay, addMonths, subMonths, startOfMonth, getDaysInMonth } from "date-fns";
import { Select, SelectItem, SelectValue, SelectTrigger, SelectContent } from "@/components/ui/select";

export type CustomCalendarProps = {
	toYear?: number;
	selected?: Date;
	fromYear?: number;
	className?: string;
	onSelect?: (date: Date | undefined) => void;
};

export const CustomCalendar = ({
	selected,
	onSelect,
	className,
	fromYear = 1950,
	toYear = new Date().getFullYear()
}: CustomCalendarProps) => {
	const [currentDate, setCurrentDate] = useState<Date>(selected || new Date(toYear, 0, 1));
	const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth());
	const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());

	useEffect(() => {
		if (selected) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- We want to update the state when the selected prop changes
			setCurrentDate(selected);
			setCurrentMonth(selected.getMonth());
			setCurrentYear(selected.getFullYear());
		}
	}, [selected]);

	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	];

	const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => toYear - i);
	const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

	const generateCalendarDays = () => {
		const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth));
		const firstDayOfMonth = getDay(startOfMonth(new Date(currentYear, currentMonth)));

		const prevMonth = subMonths(new Date(currentYear, currentMonth, 1), 1);
		const daysInPrevMonth = getDaysInMonth(prevMonth);
		const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => ({
			day: daysInPrevMonth - firstDayOfMonth + i + 1,
			isCurrentMonth: false,
			isPrevMonth: true,
			date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - firstDayOfMonth + i + 1)
		}));

		const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
			day: i + 1,
			isCurrentMonth: true,
			isPrevMonth: false,
			isNextMonth: false,
			date: new Date(currentYear, currentMonth, i + 1)
		}));

		const nextMonth = addMonths(new Date(currentYear, currentMonth, 1), 1);
		const remainingDays = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;
		const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => ({
			day: i + 1,
			isCurrentMonth: false,
			isNextMonth: true,
			date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i + 1)
		}));

		return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
	};

	const calendarDays = generateCalendarDays();

	const handleMonthChange = (month: string) => {
		const monthIndex = months.indexOf(month);
		setCurrentMonth(monthIndex);
		setCurrentDate(new Date(currentYear, monthIndex, 1));
	};

	const handleYearChange = (year: string) => {
		const yearValue = Number.parseInt(year);
		setCurrentYear(yearValue);
		setCurrentDate(new Date(yearValue, currentMonth, 1));
	};

	const handleDateSelect = (date: Date) => {
		if (onSelect) {
			onSelect(date);
		}
	};

	const isSelectedDate = (date: Date) => {
		if (!selected) return false;
		return (
			date.getDate() === selected.getDate() &&
			date.getMonth() === selected.getMonth() &&
			date.getFullYear() === selected.getFullYear()
		);
	};

	const isToday = (date: Date) => {
		const today = new Date();
		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		);
	};

	return (
		<div className={cn("p-4 bg-background rounded-md border border-border", className)}>
			<div className="flex gap-2 mb-4">
				<div className="flex-1">
					<Select value={months[currentMonth]} onValueChange={handleMonthChange}>
						<SelectTrigger className="w-full bg-background border-border">
							<div className="flex items-center justify-between w-full">
								<span>{months[currentMonth]}</span>
							</div>
						</SelectTrigger>
						<SelectContent>
							{months.map((month) => (
								<SelectItem key={month} value={month}>
									{month}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex-1">
					<Select value={currentYear.toString()} onValueChange={handleYearChange}>
						<SelectTrigger className="w-full bg-background border-border">
							<div className="flex items-center justify-between w-full">
								<span>{currentYear}</span>
							</div>
						</SelectTrigger>
						<SelectContent className="max-h-50">
							{years.map((year) => (
								<SelectItem key={year} value={year.toString()}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="mt-2">
				<div className="grid grid-cols-7 mb-2">
					{weekDays.map((day) => (
						<div key={day} className="text-center text-sm text-muted-foreground py-1">
							{day}
						</div>
					))}
				</div>

				<div className="grid grid-cols-7 gap-1">
					{calendarDays.map((day, index) => (
						<button
							key={index}
							type="button"
							onClick={() => handleDateSelect(day.date)}
							className={cn(
								"h-9 w-9 rounded-md flex items-center justify-center text-sm transition-colors cursor-pointer",
								!day.isCurrentMonth && "text-muted-foreground/50",
								day.isCurrentMonth && !isSelectedDate(day.date) && !isToday(day.date) && "hover:bg-accent",
								isSelectedDate(day.date) && "bg-primary text-primary-foreground hover:bg-primary/90",
								isToday(day.date) && !isSelectedDate(day.date) && "bg-accent text-accent-foreground"
							)}
							disabled={!day.isCurrentMonth}
						>
							{day.day}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

export default CustomCalendar;
