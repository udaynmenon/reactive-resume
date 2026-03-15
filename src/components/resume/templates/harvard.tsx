// src/components/resume/templates/harvard.tsx

import { CircleIcon, EnvelopeIcon, GlobeIcon, MapPinIcon, PhoneIcon } from "@phosphor-icons/react";
import { Fragment } from "react";
import { TiptapContent } from "@/components/input/rich-input";
import { getSectionTitle } from "@/utils/resume/section";
import { stripHtml } from "@/utils/string";
import { cn } from "@/utils/style";
import { getSectionComponent } from "../shared/get-section-component";
import { PageIcon } from "../shared/page-icon";
import { PageLink } from "../shared/page-link";
import { PagePicture } from "../shared/page-picture";
import { useResumeStore } from "../store/resume";
import type { TemplateProps } from "./types";

// ---------------------------------------------------------------------------
// Section Heading Style
// Applied to all sections via getSectionComponent, and mirrored manually
// in each Harvard*Section for the custom section renderers below.
// ---------------------------------------------------------------------------

const sectionClassName = cn(
	"[&>h6]:uppercase",
	"[&>h6]:tracking-widest",
	"[&>h6]:text-[0.68rem]",
	"[&>h6]:font-bold",
	"[&>h6]:border-b",
	"[&>h6]:border-(--page-primary-color)",
	"[&>h6]:pb-0.5",
);

// ---------------------------------------------------------------------------
// Template Root
// ---------------------------------------------------------------------------

/**
 * Template Harvard
 *
 * Single-column layout, serif-style header, uppercase ruled section headings,
 * profile photo top-right, and role-progression support within experience entries.
 *
 * Multi-role display: add roles via the "Role Progression" panel in the experience
 * dialog. When roles are present, the top-level position/period are treated as an
 * optional overall title/period span; individual roles render indented below with
 * their own position, period, and description.
 *
 * When no roles are defined, the entry renders exactly as every other template
 * (top-level position / period / description), so this template is fully
 * backward-compatible with existing resume data.
 */
export function HarvardTemplate({ pageIndex, pageLayout }: TemplateProps) {
	const isFirstPage = pageIndex === 0;
	const { main, sidebar, fullWidth } = pageLayout;

	// Custom renderers intercept known sections; all others fall through to
	// getSectionComponent() — the same pattern used by every other template.
	const renderSection = (section: string) => {
		if (section === "summary") {
			return <HarvardSummarySection key={section} sectionClassName={sectionClassName} />;
		}
		if (section === "experience") {
			return <HarvardExperienceSection key={section} sectionClassName={sectionClassName} />;
		}
		if (section === "education") {
			return <HarvardEducationSection key={section} sectionClassName={sectionClassName} />;
		}
		if (section === "projects") {
			return <HarvardProjectsSection key={section} sectionClassName={sectionClassName} />;
		}
		if (section === "skills") {
			return <HarvardSkillsSection key={section} sectionClassName={sectionClassName} />;
		}
		if (section === "languages") {
			return <HarvardLanguagesSection key={section} sectionClassName={sectionClassName} />;
		}

		const Component = getSectionComponent(section, { sectionClassName });
		return <Component key={section} id={section} />;
	};

	return (
		<div className="template-harvard page-content space-y-(--page-gap-y) px-(--page-margin-x) pt-(--page-margin-y) print:p-0">
			{isFirstPage && <Header />}

			<main data-layout="main" className="group page-main space-y-(--page-gap-y)">
				{main.map(renderSection)}
			</main>

			{!fullWidth && (
				<aside data-layout="sidebar" className="group page-sidebar space-y-(--page-gap-y)">
					{sidebar.map(renderSection)}
				</aside>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
	const basics = useResumeStore((state) => state.resume.data.basics);

	return (
		<div className="page-header flex items-center justify-between gap-x-(--page-gap-x)">
			{/* Left: name, headline, contact row */}
			<div className="page-basics flex-1 space-y-1">
				<div>
					<h2 className="basics-name text-(--page-primary-color) text-4xl!">{basics.name}</h2>
					{basics.headline && <p className="basics-headline italic opacity-75">{basics.headline}</p>}
				</div>

				{/* Horizontal contact row */}
				<div className="basics-items flex flex-wrap gap-x-5 gap-y-0.5 [&>div]:flex [&>div]:items-center [&>div]:gap-x-1.5">
					{basics.email && (
						<div className="basics-item-email">
							<EnvelopeIcon />
							<PageLink url={`mailto:${basics.email}`} label={basics.email} />
						</div>
					)}

					{basics.phone && (
						<div className="basics-item-phone">
							<PhoneIcon />
							<PageLink url={`tel:${basics.phone}`} label={basics.phone} />
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
							{field.link ? <PageLink url={field.link} label={field.text} /> : <span>{field.text}</span>}
						</div>
					))}
				</div>
			</div>

			{/* Right: profile photo (reads from store internally) */}
			<PagePicture />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Experience Section
//
// Rendering strategy:
//   - If item.roles.length > 0  → render item as a company header, then render
//     each role (position / period / description) indented below with an accent bar.
//   - If item.roles.length === 0 → render as a standard single-role entry using
//     the top-level position / period / description fields (identical to all other
//     templates — fully backward-compatible).
// ---------------------------------------------------------------------------

function HarvardExperienceSection({ sectionClassName }: { sectionClassName?: string }) {
	const section = useResumeStore((state) => state.resume.data.sections.experience);

	if (section.hidden) return null;

	const visibleItems = section.items.filter((item) => !item.hidden);
	if (visibleItems.length === 0) return null;

	return (
		<section className={cn("page-section page-section-experience", sectionClassName)}>
			<h6 className="mb-1 text-(--page-primary-color)">{section.title || getSectionTitle("experience")}</h6>

			<div className="section-content space-y-(--page-gap-y)">
				{visibleItems.map((item) => {
					const hasRoles = item.roles.length > 0;

					return (
						<div
							key={item.id}
							className="section-item section-item-experience experience-item print:break-inside-avoid"
						>
							{/* Company header row — always shown */}
							<div className="section-item-header experience-item-header flex items-start justify-between gap-x-2">
								<strong className="experience-item-company section-item-title">
									{item.options?.showLinkInTitle && item.website.url ? (
										<PageLink url={item.website.url} label={item.website.label || item.company} />
									) : (
										item.company
									)}
								</strong>

								<span className="section-item-metadata experience-item-location shrink-0 text-end">
									{item.location}
								</span>
							</div>

							{hasRoles ? (
								// ── Multi-role layout ──────────────────────────────────────
								<>
									{/* Optional overall title / overall period span */}
									{(item.position || item.period) && (
										<div className="flex items-start justify-between gap-x-2">
											{item.position && (
												<span className="section-item-metadata experience-item-overall-position italic opacity-75">
													{item.position}
												</span>
											)}
											{item.period && (
												<span className="section-item-metadata experience-item-overall-period shrink-0 text-end opacity-75">
													{item.period}
												</span>
											)}
										</div>
									)}

									{/* Individual roles with left accent bar */}
									<div className="mt-1 space-y-(--page-gap-y) border-(--page-primary-color)/25 border-l pl-3">
										{item.roles.map((role) => (
											<div key={role.id} className="experience-item-role print:break-inside-avoid">
												{/* Role position + period on same line */}
												<div className="flex items-start justify-between gap-x-2">
													<span className="section-item-metadata experience-item-position font-medium italic">
														{role.position}
													</span>
													<span className="section-item-metadata experience-item-period shrink-0 text-end">
														{role.period}
													</span>
												</div>

												{/* Role description */}
												{stripHtml(role.description) && (
													<div className="section-item-description experience-item-description">
														<TiptapContent content={role.description} />
													</div>
												)}
											</div>
										))}
									</div>
								</>
							) : (
								// ── Single-role layout (backward-compatible) ───────────────
								<>
									{/* Position + period on same line */}
									<div className="flex items-start justify-between gap-x-2">
										<span className="section-item-metadata experience-item-position font-medium italic">
											{item.position}
										</span>
										<span className="section-item-metadata experience-item-period shrink-0 text-end">
											{item.period}
										</span>
									</div>

									{/* Description */}
									{stripHtml(item.description) && (
										<div className="section-item-description experience-item-description">
											<TiptapContent content={item.description} />
										</div>
									)}

									{/* Optional website link (only when not shown in title) */}
									{!item.options?.showLinkInTitle && item.website.url && (
										<div className="section-item-website experience-item-website mt-0.5">
											<PageLink url={item.website.url} label={item.website.label || item.website.url} />
										</div>
									)}
								</>
							)}
						</div>
					);
				})}
			</div>
		</section>
	);
}

// ---------------------------------------------------------------------------
// Education Section
// ---------------------------------------------------------------------------

function HarvardEducationSection({ sectionClassName }: { sectionClassName?: string }) {
	const section = useResumeStore((state) => state.resume.data.sections.education);

	if (section.hidden) return null;
	const visibleItems = section.items.filter((item) => !item.hidden);
	if (visibleItems.length === 0) return null;

	return (
		<section className={cn("page-section page-section-education", sectionClassName)}>
			<h6 className="mb-1 text-(--page-primary-color)">{section.title || getSectionTitle("education")}</h6>

			<div className="section-content space-y-(--page-gap-y)">
				{visibleItems.map((item) => (
					<div key={item.id} className="section-item section-item-education education-item print:break-inside-avoid">
						{/* School + Location */}
						<div className="section-item-header education-item-header flex items-start justify-between gap-x-2">
							<strong className="education-item-school section-item-title">
								{item.website?.url ? (
									<PageLink
										{...item.website}
										label={item.website.label || item.school}
										// fix: label fallback, no orphan arrow
									/>
								) : (
									item.school
								)}
							</strong>
							<span className="section-item-metadata education-item-location shrink-0 text-end">{item.location}</span>
						</div>

						{/* Degree + Period */}
						<div className="flex items-start justify-between gap-x-2">
							<span className="section-item-metadata education-item-degree font-medium italic">
								{item.degree}
								{item.area ? `, ${item.area}` : ""}
							</span>
							<span className="section-item-metadata education-item-period shrink-0 text-end">{item.period}</span>
						</div>

						{/* Grade */}
						{item.grade && (
							<div className="mt-0.5 text-[9pt] opacity-80">
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

// ---------------------------------------------------------------------------
// Projects Section
// ---------------------------------------------------------------------------

function HarvardProjectsSection({ sectionClassName }: { sectionClassName?: string }) {
	const section = useResumeStore((state) => state.resume.data.sections.projects);

	if (section.hidden) return null;
	const visibleItems = section.items.filter((item) => !item.hidden);
	if (visibleItems.length === 0) return null;

	return (
		<section className={cn("page-section page-section-projects", sectionClassName)}>
			<h6 className="mb-1 text-(--page-primary-color)">{section.title || getSectionTitle("projects")}</h6>

			<div className="section-content space-y-(--page-gap-y)">
				{visibleItems.map((item) => (
					<div key={item.id} className="section-item section-item-projects project-item print:break-inside-avoid">
						{/* Title + Period */}
						<div className="section-item-header projects-item-header flex items-start justify-between gap-x-2">
							<strong className="project-item-name section-item-title">
								{item.website?.url ? <PageLink {...item.website} label={item.website.label || item.name} /> : item.name}
							</strong>
							<span className="section-item-metadata project-item-period shrink-0 text-end">{item.period}</span>
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

// ---------------------------------------------------------------------------
// Skills Section
// ---------------------------------------------------------------------------

function HarvardSkillsSection({ sectionClassName }: { sectionClassName?: string }) {
	const section = useResumeStore((state) => state.resume.data.sections.skills);

	if (section.hidden) return null;
	const visibleItems = section.items.filter((item) => !item.hidden);
	if (visibleItems.length === 0) return null;

	return (
		<section className={cn("page-section page-section-skills", sectionClassName)}>
			<h6 className="mb-1 text-(--page-primary-color)">{section.title || getSectionTitle("skills")}</h6>

			<div className="section-content space-y-0.5">
				{visibleItems.map((item) => (
					<div
						key={item.id}
						className="section-item section-item-skills skill-item flex items-center gap-x-1 print:break-inside-avoid"
					>
						<span className="font-bold">{item.name}</span>

						{item.keywords && item.keywords.length > 0 && (
							<div className="flex items-center gap-x-3">
								<span> </span>
								{item.keywords.map((keyword, index) => (
									<Fragment key={`${item.id}-${index}`}>
										<span>{keyword}</span>
										{index !== item.keywords.length - 1 && (
											<CircleIcon className="text-(--page-primary-color)" size={3} weight="fill" />
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

// ---------------------------------------------------------------------------
// Languages Section
// ---------------------------------------------------------------------------

function HarvardLanguagesSection({ sectionClassName }: { sectionClassName?: string }) {
	const section = useResumeStore((state) => state.resume.data.sections.languages);

	if (section.hidden) return null;
	const visibleItems = section.items.filter((item) => !item.hidden);
	if (visibleItems.length === 0) return null;

	return (
		<section className={cn("page-section page-section-languages", sectionClassName)}>
			<h6 className="mb-1 text-(--page-primary-color)">{section.title || getSectionTitle("languages")}</h6>

			<div className="section-content flex flex-wrap items-center gap-x-2">
				{visibleItems.map((item, index) => (
					<Fragment key={item.id}>
						<div className="section-item section-item-languages language-item flex items-center gap-x-1 print:break-inside-avoid">
							<span className="font-bold">{item.language}</span>
							{item.fluency && <span className="italic opacity-80">{item.fluency}</span>}
						</div>

						{index !== visibleItems.length - 1 && (
							<CircleIcon className="text-(--page-primary-color)" size={3} weight="fill" />
						)}
					</Fragment>
				))}
			</div>
		</section>
	);
}

// ---------------------------------------------------------------------------
// Summary Section
// ---------------------------------------------------------------------------

function HarvardSummarySection({ sectionClassName }: { sectionClassName?: string }) {
	const section = useResumeStore((state) => state.resume.data.summary);

	// Guard: don't render heading for an empty rich-text field.
	// TiptapContent renders an empty <p> for blank content, so stripHtml() is
	// needed in addition to the falsy check on section.content.
	if (section.hidden || !section.content || !stripHtml(section.content)) {
		return null;
	}

	return (
		<section className={cn("page-section page-section-summary", sectionClassName)}>
			<h6 className="mb-1 text-(--page-primary-color)">{section.title || getSectionTitle("summary")}</h6>

			<div className="section-content">
				<TiptapContent content={section.content} />
			</div>
		</section>
	);
}
