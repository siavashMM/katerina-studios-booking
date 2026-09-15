import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, LeafIcon } from "@/components/ui/icons";
import { websiteProposal } from "@/content/website-proposal";
import { getServerLocale } from "@/i18n/server";
import styles from "./website-plans.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const copy = websiteProposal[locale];
  return {
    ...copy.meta,
    robots: { index: false, follow: false },
  };
}

export default async function WebsitePlansPage() {
  const locale = await getServerLocale();
  const copy = websiteProposal[locale];

  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.hero} aria-labelledby="proposal-title">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1 id="proposal-title">{copy.hero.title}</h1>
            <p className="lead">{copy.hero.introduction}</p>
          </div>
          <aside className={styles.recommendation} aria-label={copy.hero.recommendedLabel}>
            <div className={styles.recommendationTop}>
              <LeafIcon width={25} height={25} />
              <span>{copy.hero.recommendedLabel}</span>
            </div>
            <h2>{copy.hero.recommendedPlan}</h2>
            <p className={styles.recommendationPrice}>{copy.hero.recommendedPrice}</p>
            <p>{copy.hero.recommendedText}</p>
          </aside>
        </div>
      </section>

      <section className={`container section ${styles.plansSection}`} aria-labelledby="plans-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">{copy.plans.eyebrow}</p>
            <h2 id="plans-title">{copy.plans.title}</h2>
          </div>
          <p>{copy.plans.introduction}</p>
        </div>

        <div className={styles.planGrid}>
          {copy.plans.items.map((plan) => (
            <article
              className={`${styles.planCard}${plan.recommended ? ` ${styles.planRecommended}` : ""}`}
              key={plan.name}
            >
              <header className={styles.planHeader}>
                <p className={styles.planStatus}>{plan.status}</p>
                <h3>{plan.name}</h3>
                <p className={styles.planTagline}>{plan.tagline}</p>
              </header>

              <div className={styles.planPrice}>
                <strong>{plan.price}</strong>
                <span>{plan.priceNote}</span>
              </div>

              <p className={styles.planDescription}>{plan.description}</p>
              <p className={styles.planBestFor}>
                <strong>{copy.plans.bestForLabel}</strong>
                <span>{plan.bestFor}</span>
              </p>

              <div className={styles.planFeatures}>
                <p>{copy.plans.includesLabel}</p>
                <ul className={styles.featureList}>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.planOperations}>
                <p>{plan.operatingModelLabel}</p>
                <span>{plan.operatingModel}</span>
              </div>

              <div className={styles.planLimits}>
                <p className={styles.planBoundary}>{plan.boundary}</p>
                {plan.scopeNote ? <p className={styles.scopeNote}>{plan.scopeNote}</p> : null}
              </div>

              <Link
                className={`button ${plan.recommended ? "" : "button-secondary"} ${styles.planAction}`}
                href="#next-step"
              >
                {plan.action} <ArrowIcon />
              </Link>
            </article>
          ))}
        </div>
        <p className={styles.annualCost}>{copy.plans.annualCost}</p>
      </section>

      <section className={styles.revisionSection} aria-labelledby="revision-title">
        <div className={`container ${styles.revisionInner}`}>
          <div className={styles.revisionCopy}>
            <p className="eyebrow">{copy.revisions.eyebrow}</p>
            <h2 id="revision-title">{copy.revisions.title}</h2>
            <p>{copy.revisions.introduction}</p>
          </div>
          <div>
            <ul className={styles.revisionList}>
              {copy.revisions.items.map((item, index) => (
                <li key={item}>
                  <span aria-hidden="true">0{index + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className={styles.revisionClosing}>{copy.revisions.closing}</p>
          </div>
        </div>
      </section>

      <section
        className={`container section ${styles.planComparisonSection}`}
        aria-labelledby="plan-comparison-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">{copy.planComparison.eyebrow}</p>
            <h2 id="plan-comparison-title">{copy.planComparison.title}</h2>
          </div>
          <p>{copy.planComparison.introduction}</p>
        </div>

        <div className={styles.desktopPlanComparison}>
          <table className={styles.planTable}>
            <caption className="sr-only">{copy.planComparison.title}</caption>
            <colgroup>
              <col />
              <col />
              <col className={styles.recommendedColumn} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{copy.planComparison.columns.feature}</th>
                <th scope="col">{copy.planComparison.columns.essential}</th>
                <th scope="col" className={styles.recommendedHeading}>
                  <span>{copy.planComparison.recommendedLabel}</span>
                  {copy.planComparison.columns.ownerControl}
                </th>
                <th scope="col">{copy.planComparison.columns.fullControl}</th>
              </tr>
            </thead>
            {copy.planComparison.groups.map((group) => (
              <tbody key={group.title}>
                <tr className={styles.tableGroup}>
                  <th scope="rowgroup" colSpan={4}>
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    <td>{row.essential}</td>
                    <td>{row.ownerControl}</td>
                    <td>{row.fullControl}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>

        <div className={styles.mobilePlanComparison}>
          {copy.planComparison.groups.map((group, groupIndex) => (
            <section
              className={styles.mobileComparisonGroup}
              aria-labelledby={`comparison-group-${groupIndex}`}
              key={group.title}
            >
              <h3 id={`comparison-group-${groupIndex}`}>{group.title}</h3>
              {group.rows.map((row) => (
                <article className={styles.mobileComparisonFeature} key={row.feature}>
                  <h4>{row.feature}</h4>
                  <dl>
                    <div>
                      <dt>{copy.planComparison.columns.essential}</dt>
                      <dd>{row.essential}</dd>
                    </div>
                    <div className={styles.mobileRecommendedValue}>
                      <dt>
                        {copy.planComparison.columns.ownerControl}
                        <span>{copy.planComparison.recommendedLabel}</span>
                      </dt>
                      <dd>{row.ownerControl}</dd>
                    </div>
                    <div>
                      <dt>{copy.planComparison.columns.fullControl}</dt>
                      <dd>{row.fullControl}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </section>
          ))}
        </div>
      </section>

      <section className={styles.costSection} aria-labelledby="cost-title">
        <div className="container">
          <div className={`${styles.sectionHeading} ${styles.lightHeading}`}>
            <div>
              <p className="eyebrow">{copy.runningCosts.eyebrow}</p>
              <h2 id="cost-title">{copy.runningCosts.title}</h2>
            </div>
            <p>{copy.runningCosts.introduction}</p>
          </div>
          <div className={styles.costGrid}>
            {copy.runningCosts.items.map((item) => (
              <article className={styles.costCard} key={item.label}>
                <h3 className={styles.costLabel}>{item.label}</h3>
                <p className={styles.costPrice}>{item.price}</p>
                <p className={styles.costCadence}>{item.cadence}</p>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className={styles.costTotal}>
            <p>{copy.runningCosts.totalLabel}</p>
            <strong>{copy.runningCosts.total}</strong>
            <span>{copy.runningCosts.totalText}</span>
          </div>
          <div className={styles.costExamples}>
            <p>{copy.runningCosts.examplesTitle}</p>
            <ul>
              {copy.runningCosts.examples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.ownershipSection} aria-labelledby="ownership-title">
        <div className={`container ${styles.ownershipInner}`}>
          <div>
            <p className="eyebrow">{copy.ownership.eyebrow}</p>
            <h2 id="ownership-title">{copy.ownership.title}</h2>
          </div>
          <div className={styles.ownershipDetails}>
            <p>{copy.ownership.text}</p>
            <ul>
              {copy.ownership.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        className={`container section ${styles.marketSection}`}
        aria-labelledby="market-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">{copy.comparison.eyebrow}</p>
            <h2 id="market-title">{copy.comparison.title}</h2>
          </div>
          <p>{copy.comparison.introduction}</p>
        </div>

        <div className={styles.comparisonList}>
          <div className={styles.comparisonHeader} aria-hidden="true">
            <span>{copy.comparison.columns.product}</span>
            <span>{copy.comparison.columns.cost}</span>
            <span>{copy.comparison.columns.goodFor}</span>
            <span>{copy.comparison.columns.tradeOff}</span>
          </div>
          {copy.comparison.rows.map((row) => (
            <article className={styles.comparisonRow} key={row.product}>
              <div>
                <span className={styles.mobileLabel}>{copy.comparison.columns.product}</span>
                {row.href ? (
                  <a href={row.href} target="_blank" rel="noopener noreferrer">
                    <strong>{row.product}</strong>
                    <span className="sr-only">{copy.notes.externalHint}</span>
                  </a>
                ) : (
                  <strong>{row.product}</strong>
                )}
              </div>
              <div>
                <span className={styles.mobileLabel}>{copy.comparison.columns.cost}</span>
                {row.cost}
              </div>
              <div>
                <span className={styles.mobileLabel}>{copy.comparison.columns.goodFor}</span>
                {row.goodFor}
              </div>
              <div>
                <span className={styles.mobileLabel}>{copy.comparison.columns.tradeOff}</span>
                {row.tradeOff}
              </div>
            </article>
          ))}
        </div>

        <aside className={styles.conclusion}>
          <LeafIcon width={30} height={30} />
          <div>
            <h3>{copy.comparison.conclusionTitle}</h3>
            <p>{copy.comparison.conclusion}</p>
          </div>
        </aside>
      </section>

      <section className={styles.afterLaunchSection} aria-labelledby="after-launch-title">
        <div className="container">
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">{copy.afterLaunch.eyebrow}</p>
              <h2 id="after-launch-title">{copy.afterLaunch.title}</h2>
            </div>
            <p>{copy.afterLaunch.introduction}</p>
          </div>
          <div className={styles.afterLaunchGrid}>
            {copy.afterLaunch.items.map((item, index) => (
              <article
                className={index === 1 ? styles.afterLaunchRecommended : undefined}
                key={item.name}
              >
                <h3>{item.name}</h3>
                <p>{item.text}</p>
                <strong>{item.cost}</strong>
              </article>
            ))}
          </div>
          <p className={styles.afterLaunchNote}>{copy.afterLaunch.note}</p>
        </div>
      </section>

      <section
        className={`container section ${styles.additionsSection}`}
        aria-labelledby="additions-title"
      >
        <div className={styles.additionsIntro}>
          <p className="eyebrow">{copy.additions.eyebrow}</p>
          <h2 id="additions-title">{copy.additions.title}</h2>
          <p>{copy.additions.introduction}</p>
        </div>
        <ul className={styles.additionsList}>
          {copy.additions.items.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <strong>{copy.additions.quoteLabel}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="next-step"
        className={`container section ${styles.nextSection}`}
        aria-labelledby="next-title"
      >
        <div className={styles.nextCopy}>
          <p className="eyebrow">{copy.next.eyebrow}</p>
          <h2 id="next-title">{copy.next.title}</h2>
          <p>{copy.next.text}</p>
        </div>
        <ol className={styles.nextSteps}>
          {copy.next.steps.map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">0{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className={styles.closing}>{copy.next.closing}</p>
      </section>

      <section className={styles.notesSection} aria-labelledby="notes-title">
        <div className="container">
          <h2 id="notes-title">{copy.notes.title}</h2>
          <p>
            <strong>{copy.notes.checked}</strong> {copy.notes.text}
          </p>
          <p className={styles.sourceLabel}>{copy.notes.sourceLabel}</p>
          <ul className={styles.sourceList}>
            {copy.notes.sources.map((source) => (
              <li key={source.href}>
                <a href={source.href} target="_blank" rel="noopener noreferrer">
                  {source.label}
                  <span className="sr-only">{copy.notes.externalHint}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
