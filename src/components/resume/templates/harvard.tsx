import { EnvelopeIcon, GlobeIcon, MapPinIcon, PhoneIcon } from "@phosphor-icons/react";
import { TiptapContent } from "@/components/input/rich-input";
import { cn } from "@/utils/style";
import { stripHtml } from "@/utils/string";
import { getSectionComponent } from "../shared/get-section-component";
import { PageIcon } from "../shared/page-icon";
import { PageLink } from "../shared/page-link";
import { PagePicture } from "../shared/page-picture";
import { useResumeStore } from "../store/resume";
import type { SectionItem } from "@/schema/resume/data";
import type { TemplateProps } from "./types";

// ─── Grouping Utility ────────────────────────────────────────────────────────

type ExperienceGroup = {
  company: string;
  location: string;
  roles: SectionItem<"experience">[];
};

function groupByCompany(items: SectionItem<"experience">[]): ExperienceGroup[] {
  return items
    .filter((item) => !item.hidden)
    .reduce<ExperienceGroup[]>((groups, item) => {
      const last = groups[groups.length - 1];
      // Only group CONSECUTIVE items with matching, non-empty company name
      if (last && last.company === item.company && item.company.trim() !== "") {
        last.roles.push(item);
      } else {
        groups.push({
          company: item.company,
          location: item.location,
          roles: [item],
        });
      }
      return groups;
    }, []);
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
    // Intercept experience — render with company grouping
    if (section === "experience") {
      return (
        <HarvardExperienceSection key={section} sectionClassName={sectionClassName} />
      );
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

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  const basics = useResumeStore((state) => state.resume.data.basics);

  return (
    <div className="page-header flex items-start justify-between gap-x-(--page-gap-x) border-b-[1.5px] border-(--page-primary-color) pb-3">
      {/* Left: name, headline, contact row */}
      <div className="page-basics flex-1 space-y-1.5">
        <div>
          <h2 className="basics-name text-(--page-primary-color)">{basics.name}</h2>
          {basics.headline && (
            <p className="basics-headline italic opacity-75">{basics.headline}</p>
          )}
        </div>

        {/* Horizontal contact row with pipe separators */}
        <div className="basics-items flex flex-wrap gap-x-2 gap-y-0.5 *:flex *:items-center *:gap-x-1.5 *:border-(--page-primary-color) *:border-e *:py-0.5 *:pe-2 *:last:border-e-0">
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

type HarvardExperienceSectionProps = {
  sectionClassName?: string;
};

function HarvardExperienceSection({ sectionClassName }: HarvardExperienceSectionProps) {
  const section = useResumeStore((state) => state.resume.data.sections.experience);

  if (section.hidden) return null;

  const groups = groupByCompany(section.items);
  if (groups.length === 0) return null;

  return (
    <section className={cn("page-section page-section-experience", sectionClassName)}>
      {/* h6 is styled by sectionClassName's [&>h6]: selectors */}
      <h6 className="mb-1.5 text-(--page-primary-color)">
        {section.title || "Experience"}
      </h6>

      <div className="section-content space-y-(--page-gap-y)">
        {groups.map((group, groupIdx) => {
          const isGrouped = group.roles.length > 1;

          return (
            <div key={`${group.company}-${groupIdx}`} className="print:break-inside-avoid">

              {/* Company name + location — rendered ONCE per group */}
              <div className="experience-item-header flex items-start justify-between gap-x-2 mb-1">
                <strong className="experience-item-title section-item-title">
                  {group.company}
                </strong>
                {group.location && (
                  <span className="section-item-metadata experience-item-location shrink-0 text-end">
                    {group.location}
                  </span>
                )}
              </div>

              {/* Roles — left accent bar only when 2+ roles share this company */}
              <div
                className={cn(
                  "space-y-2",
                  isGrouped && "border-l-2 border-(--page-primary-color) pl-3",
                )}
              >
                {group.roles.map((role) => (
                  <div key={role.id} className="experience-item print:break-inside-avoid">

                    {/* Position + period on same line */}
                    <div className="flex items-start justify-between gap-x-2">
                      <span className="section-item-metadata experience-item-position font-semibold">
                        {role.position}
                      </span>
                      <span className="section-item-metadata experience-item-period shrink-0 text-end">
                        {role.period}
                      </span>
                    </div>

                    {/* Bullet-point description */}
                    {stripHtml(role.description) && (
                      <div className="section-item-description experience-item-description mt-0.5">
                        <TiptapContent content={role.description} />
                      </div>
                    )}

                    {/* Optional website link */}
                    {!role.options?.showLinkInTitle && role.website.url && (
                      <div className="section-item-website experience-item-website mt-0.5">
                        <PageLink
                          url={role.website.url}
                          label={role.website.label || role.website.url}
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
