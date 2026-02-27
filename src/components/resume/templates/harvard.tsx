import { Fragment } from "react";
import {
	CircleIcon,
	EnvelopeIcon,
	GlobeIcon,
	MapPinIcon,
	PhoneIcon,
} from "@phosphor-icons/react";
import { TiptapContent } from "@/components/input/rich-input";
import type { SectionItem } from "@/schema/resume/data";
import { getSectionTitle } from "@/utils/resume/section";
import { stripHtml } from "@/utils/string";
import { cn } from "@/utils/style";
import { getSectionComponent } from "../shared/get-section-component";
import { PageIcon } from "../shared/page-icon";
import { PageLink } from "../shared/page-link";
import { PagePicture } from "../shared/page-picture";
import { useResumeStore } from "../store/resume";
import type { TemplateProps } from "./types";

// ─── Grouping Utility ────────────────────────────────────────────────────────

type ExperienceGroup = {
	company: string;
	location: string;
	company_period: string;
	roles: SectionItem<"experience">[];
};

// ─── Period Parsing ───────────────────────────────────────────────────────────
// Handles common separators: en-dash, em-dash, hyphen(s), "to", "until", "→"
// Examples covered:
//   "08/2022 – 06/2024"   "Jan 2020 to Present"
//   "2019 — 2021"         "2022-2024"
const PERIOD_SEPARATOR = /\s*(–|—|-{1,2}|to|until|→)\s*/i;

function splitPeriod(period: string): {
	start: string;
	separator: string;
	end: string;
} {
	const parts = period.trim().split(PERIOD_SEPARATOR);

	return {
		start: parts[0]?.trim() ?? "",
		separator: parts[1]?.trim() ?? "",
		end: parts.at(-1)?.trim() ?? "",
	};
}

// Assumes roles are in reverse-chronological order (most recent first),
// which is the standard resume convention.
function buildCompanyPeriod(roles: SectionItem<"experience">[]): string {
	if (roles.length === 0) return "";
	if (roles.length === 1) return roles[0].period;

	const { end } = splitPeriod(roles[0].period); // most recent role's end
	const { separator } = splitPeriod(roles[0].period); // separator
	const { start } = splitPeriod(roles.at(-1)!.period); // oldest role's start

	// Fallback to the first role's period if either bound can't be parsed
	if (!start || !end) return roles[0].period;

	return `${start} ${separator} ${end}`;
}

function groupByCompany(items: SectionItem<"experience">[]): ExperienceGroup[] {
	const visibleItems = items.filter((item) => !item.hidden);

	return visibleItems
		.reduce<ExperienceGroup[]>((groups, item) => {
			const lastGroup = groups.at(-1);
			const isSameCompany =
				lastGroup !== undefined &&
				item.company.trim() !== "" &&
				lastGroup.company === item.company;

			if (isSameCompany && lastGroup) {
				lastGroup.roles.push(item);
			} else {
				groups.push({
					company: item.company,
					location: item.location,
					company_period: "", // populated in .map() below
					roles: [item],
				});
			}

			return groups;
		}, [])
		.map((group) => ({
			...group,
			company_period: buildCompanyPeriod(group.roles),
		}));
}

// ─── Section Heading Style ────────────────────────────────────────────────────
// Applied to all sections via getSectionComponent, and mirrored manually
// in HarvardExperienceSection for the custom experience render.

const sectionClassName = cn(
	"[&>h6]:uppercase",
	"[&>h6]:tracking-widest",
	"[&>h6]:text-[0.68rem]",
	"[&>h6]:font-bold",
	"[&>h6]:border-b",
	"[&>h6]:border-(--page-primary-color)",
	"[&>h6]:pb-0.5",
);

// ─── Template Root ────────────────────────────────────────────────────────────

/**
 * Template: Harvard
 *
 * Single-column layout, serif-style header, uppercase ruled section headings,
 * profile photo top-right, and grouped experience entries by company.
 */
export function HarvardTemplate({ pageIndex, pageLayout }: TemplateProps) {
	const isFirstPage = pageIndex === 0;
	const { main, sidebar, fullWidth } = pageLayout;

	const renderSection = (section: string) => {
		// Intercept custom sections
		if (section === "summary") {
			return (
				<HarvardSummarySection
					key={section}
					sectionClassName={sectionClassName}
				/>
			);
		}
		if (section === "experience") {
			return (
				<HarvardExperienceSection
					key={section}
					sectionClassName={sectionClassName}
				/>
			);
		}
		if (section === "education") {
			return (
				<HarvardEducationSection
					key={section}
					sectionClassName={sectionClassName}
				/>
			);
		}
		if (section === "projects") {
			return (
				<HarvardProjectsSection
					key={section}
					sectionClassName={sectionClassName}
				/>
			);
		}
		if (section === "skills") {
			return (
				<HarvardSkillsSection
					key={section}
					sectionClassName={sectionClassName}
				/>
			);
		}
		if (section === "languages") {
			return (
				<HarvardLanguagesSection
					key={section}
					sectionClassName={sectionClassName}
				/>
			);
		}
		const Component = getSectionComponent(section, { sectionClassName });
		return <Component key={section} id={section} />;
	};

	return (
		<div className="template-harvard page-content space-y-(--page-gap-y) px-(--page-margin-x) pt-(--page-margin-y) print:p-0">
			{isFirstPage && <Header />}

			<main
				data-layout="main"
				className="group page-main space-y-(--page-gap-y)"
			>
				{main.map(renderSection)}
			</main>

			{!fullWidth && (
				<aside
					data-layout="sidebar"
					className="group page-sidebar space-y-(--page-gap-y)"
				>
					{sidebar.map(renderSection)}
				</aside>
			)}
		</div>
	);
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
	const basics = useResumeStore((state) => state.resume.data.basics);

	return (
		<div className="page-header flex items-center justify-between gap-x-(--page-gap-x)">
			{/* Left: name, headline, contact row */}
			<div className="page-basics flex-1 space-y-1">
				<div>
					<h2 className="basics-name text-(--page-primary-color) text-4xl!">
						{basics.name}
					</h2>
					{basics.headline && (
						<p className="basics-headline italic opacity-75">
							{basics.headline}
						</p>
					)}
				</div>

				{/* Horizontal contact row with pipe separators */}
				<div className="basics-items flex flex-wrap gap-x-5 gap-y-0.5 *:flex *:items-center *:gap-x-1.5">
					{basics.email && (
						<div className="basics-item-email">
							<EnvelopeIcon />
							<PageLink
								url={`mailto:${basics.email}`}
								label={basics.email}
							/>
						</div>
					)}
					{basics.phone && (
						<div className="basics-item-phone">
							<PhoneIcon />
							<PageLink
								url={`tel:${basics.phone}`}
								label={basics.phone}
							/>
						</div>
					)}
					{basics.location && (
						<div className="basics-item-location">
							<MapPinIcon />
							<span>{basics.location}</span>
						</div>
					)}
					{basics.website.url && (
						<div className="basics-item-website">
							<GlobeIcon />
							<PageLink {...basics.website} />
						</div>
					)}
					{basics.customFields.map((field) => (
						<div key={field.id} className="basics-item-custom">
							<PageIcon icon={field.icon} />
							{field.link ? (
								<PageLink url={field.link} label={field.text} />
							) : (
								<span>{field.text}</span>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Right: profile photo — PagePicture reads from store internally */}
			<PagePicture />
		</div>
	);
}

// ─── Harvard Experience Section ───────────────────────────────────────────────

function HarvardExperienceSection({
	sectionClassName,
}: {
	sectionClassName?: string;
}) {
	const section = useResumeStore(
		(state) => state.resume.data.sections.experience,
	);

	if (section.hidden) return null;

	const groups = groupByCompany(section.items);
	if (groups.length === 0) return null;

	return (
		<section
			className={cn(
				"page-section page-section-experience",
				sectionClassName,
			)}
		>
			<h6 className="mb-1 text-(--page-primary-color)">
				{section.title || getSectionTitle("experience")}
			</h6>

			<div className="section-content space-y-(--page-gap-y)">
				{groups.map((group, groupIdx) => {
					const isGrouped = group.roles.length > 1;

					return (
						<div
							key={`${group.company}-${groupIdx}`}
							className="print:break-inside-avoid"
						>
							{/* Company name + location — rendered ONCE per group */}
							<div className="section-item-header experience-item-header flex items-start justify-between gap-x-2">
								<strong className="experience-item-title section-item-title">
									{group.company}
								</strong>
								{group.location && (
									<span className="section-item-metadata experience-item-location flex items-center shrink-0 text-end">
										{group.location}
										{isGrouped && (
											<>
												<div className="h-1 w-1 bg-(--page-primary-color) rounded-full mx-2"></div>
												{group.company_period}
											</>
										)}
									</span>
								)}
							</div>

							{/* Roles — left accent bar only when 2+ roles share this company */}
							<div
								className={cn(
									isGrouped &&
										"border-l border-(--page-primary-color)/25 pl-2",
								)}
							>
								{group.roles.map((role) => (
									<div
										key={role.id}
										className="section-item section-item-experience experience-item print:break-inside-avoid"
									>
										{/* Position + period on same line */}
										<div className="flex items-start justify-between gap-x-2">
											<span className="section-item-metadata italic experience-item-position font-medium">
												{role.position}
											</span>
											<span className="section-item-metadata experience-item-period shrink-0 text-end">
												{role.period}
											</span>
										</div>

										{/* Bullet-point description */}
										{stripHtml(role.description) && (
											<div className="section-item-description experience-item-description">
												<TiptapContent
													content={role.description}
												/>
											</div>
										)}

										{/* Optional website link */}
										{!role.options?.showLinkInTitle &&
											role.website.url && (
												<div className="section-item-website experience-item-website mt-0.5">
													<PageLink
														url={role.website.url}
														label={
															role.website
																.label ||
															role.website.url
														}
													/>
												</div>
											)}
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}

// ─── Harvard Education Section ──────────────────────────────────────────────────

function HarvardEducationSection({
	sectionClassName,
}: {
	sectionClassName?: string;
}) {
	const section = useResumeStore(
		(state) => state.resume.data.sections.education,
	);

	if (section.hidden) return null;
	const visibleItems = section.items.filter((item) => !item.hidden);
	if (visibleItems.length === 0) return null;

	return (
		<section
			className={cn(
				"page-section page-section-education",
				sectionClassName,
			)}
		>
			<h6 className="mb-1 text-(--page-primary-color)">
				{section.title || getSectionTitle("education")}
			</h6>

			<div className="section-content space-y-(--page-gap-y)">
				{visibleItems.map((item) => (
					<div
						key={item.id}
						className="section-item section-item-education education-item print:break-inside-avoid"
					>
						{/* School + Location */}
						<div className="section-item-header education-item-header flex items-start justify-between gap-x-2">
							<strong className="education-item-school section-item-title">
								{item.website?.url ? (
									<PageLink
										{...item.website}
										label={
											item.school || item.website.label
										}
									/>
								) : (
									item.school
								)}
							</strong>
							<span className="section-item-metadata education-item-location shrink-0 text-end">
								{item.location}
							</span>
						</div>

						{/* Degree + Period */}
						<div className="flex items-start justify-between gap-x-2">
							<span className="section-item-metadata education-item-degree font-medium italic">
								{item.degree}
								{item.area ? `, ${item.area}` : ""}
							</span>
							<span className="section-item-metadata education-item-period shrink-0 text-end">
								{item.period}
							</span>
						</div>

						{/* Grade */}
						{item.grade && (
							<div className="text-[9pt] mt-0.5 opacity-80">
								<span>Grade: {item.grade}</span>
							</div>
						)}

						{/* Description */}
						{stripHtml(item.description) && (
							<div className="section-item-description education-item-description mt-1">
								<TiptapContent content={item.description} />
							</div>
						)}
					</div>
				))}
			</div>
		</section>
	);
}

// ─── Harvard Skills Section ─────────────────────────────────────────────────────

function HarvardSkillsSection({
	sectionClassName,
}: {
	sectionClassName?: string;
}) {
	const section = useResumeStore(
		(state) => state.resume.data.sections.skills,
	);

	if (section.hidden) return null;
	const visibleItems = section.items.filter((item) => !item.hidden);
	if (visibleItems.length === 0) return null;

	return (
		<section
			className={cn("page-section page-section-skills", sectionClassName)}
		>
			<h6 className="mb-1 text-(--page-primary-color)">
				{section.title || getSectionTitle("skills")}
			</h6>

			<div className="section-content space-y-0.5">
				{visibleItems.map((item) => (
					<div
						key={item.id}
						className="section-item section-item-skills skill-item print:break-inside-avoid flex items-center gap-x-1"
					>
						<span className="font-bold">{item.name}</span>
						{item.keywords && item.keywords.length > 0 && (
							<div className="flex items-center gap-x-3">
								<span> : </span>
								{item.keywords.map((keyword, index) => (
									<Fragment key={`${item.id}-${index}`}>
										<span>{keyword}</span>
										{index !== item.keywords.length - 1 && (
											<CircleIcon
												className="text-(--page-primary-color)"
												size={3}
												weight="fill"
											/>
										)}
									</Fragment>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</section>
	);
}

// ─── Harvard Languages Section ──────────────────────────────────────────────────

function HarvardLanguagesSection({
	sectionClassName,
}: {
	sectionClassName?: string;
}) {
	const section = useResumeStore(
		(state) => state.resume.data.sections.languages,
	);

	if (section.hidden) return null;
	const visibleItems = section.items.filter((item) => !item.hidden);
	if (visibleItems.length === 0) return null;

	return (
		<section
			className={cn(
				"page-section page-section-languages",
				sectionClassName,
			)}
		>
			<h6 className="mb-1 text-(--page-primary-color)">
				{section.title || getSectionTitle("languages")}
			</h6>

			<div className="section-content flex flex-wrap items-center gap-x-2">
				{visibleItems.map((item, index) => (
					<Fragment key={item.id}>
						<div className="section-item section-item-languages language-item flex items-center gap-x-1 print:break-inside-avoid">
							<span className="font-bold">{item.language}</span>
							{item.fluency && (
								<span className="italic opacity-80">
									({item.fluency})
								</span>
							)}
						</div>
						{index !== visibleItems.length - 1 && (
							<CircleIcon
								className="text-(--page-primary-color)"
								size={3}
								weight="fill"
							/>
						)}
					</Fragment>
				))}
			</div>
		</section>
	);
}

// ─── Harvard Summary Section ────────────────────────────────────────────────────

function HarvardSummarySection({
	sectionClassName,
}: {
	sectionClassName?: string;
}) {
	const section = useResumeStore((state) => state.resume.data.summary);

	if (section.hidden || !section.content || !stripHtml(section.content))
		return null;

	return (
		<section
			className={cn(
				"page-section page-section-summary",
				sectionClassName,
			)}
		>
			<h6 className="mb-1 text-(--page-primary-color)">
				{section.title || getSectionTitle("summary")}
			</h6>

			<div className="section-content">
				<TiptapContent content={section.content} />
			</div>
		</section>
	);
}

// ─── Harvard Projects Section ───────────────────────────────────────────────────

function HarvardProjectsSection({
	sectionClassName,
}: {
	sectionClassName?: string;
}) {
	const section = useResumeStore(
		(state) => state.resume.data.sections.projects,
	);

	if (section.hidden) return null;
	const visibleItems = section.items.filter((item) => !item.hidden);
	if (visibleItems.length === 0) return null;

	return (
		<section
			className={cn(
				"page-section page-section-projects",
				sectionClassName,
			)}
		>
			<h6 className="mb-1 text-(--page-primary-color)">
				{section.title || getSectionTitle("projects")}
			</h6>

			<div className="section-content space-y-(--page-gap-y)">
				{visibleItems.map((item) => (
					<div
						key={item.id}
						className="section-item section-item-projects project-item print:break-inside-avoid"
					>
						{/* Title + Period */}
						<div className="section-item-header projects-item-header flex items-start justify-between gap-x-2">
							<strong className="project-item-name section-item-title">
								{item.website?.url ? (
									<PageLink
										{...item.website}
										label={item.name || item.website.label}
									/>
								) : (
									item.name
								)}
							</strong>
							<span className="section-item-metadata project-item-period shrink-0 text-end">
								{item.period}
							</span>
						</div>

						{/* Description */}
						{stripHtml(item.description) && (
							<div className="section-item-description project-item-description">
								<TiptapContent content={item.description} />
							</div>
						)}
					</div>
				))}
			</div>
		</section>
	);
}
