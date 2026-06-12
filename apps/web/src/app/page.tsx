import "./globals.css";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  slug: string;
  location: string;
  workMode: string;
  jobType: string;
  experienceLevel: string;
  minSalary?: number;
  maxSalary?: number;
  company: {
    name: string;
  };
};

async function getJobs(q?: string, workMode?: string) {
  const query = new URLSearchParams();

  if (q) query.set("q", q);
  if (workMode) query.set("workMode", workMode);

  const res = await fetch(`http://localhost:5000/jobs?${query.toString()}`, {
    cache: "no-store",
  });

  return res.json();
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    workMode?: string;
  }>;
}) {
  const params = await searchParams;

  const jobsResponse = await getJobs(params.q, params.workMode);

  const jobs: Job[] = jobsResponse.data ?? [];

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">🚀 AI Job OS</span>

          <h1>
            Find Your Next
            <span> Dream Job</span>
          </h1>

          <p>
            Search jobs aggregated from multiple sources and discover
            opportunities tailored to your skills.
          </p>
        </div>
      </section>

      <section className="stats">
        <div className="stat-card">
          <h3>{jobsResponse.meta.total}</h3>
          <p>Total Jobs</p>
        </div>

        <div className="stat-card">
          <h3>16+</h3>
          <p>Job Sources</p>
        </div>

        <div className="stat-card">
          <h3>Remote</h3>
          <p>Opportunities</p>
        </div>

        <div className="stat-card">
          <h3>AI Powered</h3>
          <p>Matching</p>
        </div>
      </section>

      <section className="jobs-section">
        <div className="section-header">
          <h2>Latest Jobs</h2>
          <p>{jobs.length} opportunities available</p>
        </div>

        <form className="search-form">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search React, Next.js, Node..."
            className="search-input"
          />

          <select
            name="workMode"
            defaultValue={params.workMode}
            className="filter-select"
          >
            <option value="">All Modes</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">Onsite</option>
          </select>

          <button type="submit" className="search-btn">
            Search
          </button>
        </form>

        <div className="jobs-grid">
          {jobs.map((job) => (
            <article key={job.id} className="job-card">
              <div className="job-header">
                <h3>{job.title}</h3>

                <span className="badge">{job.workMode}</span>
              </div>

              <p className="company">{job.company?.name}</p>

              <div className="meta">
                <span>{job.location}</span>
                <span>{job.jobType}</span>
                <span>{job.experienceLevel}</span>
              </div>

              {(job.minSalary || job.maxSalary) && (
                <div className="salary">
                  ₹{job.minSalary?.toLocaleString() ?? "-"}
                  {" - "}₹{job.maxSalary?.toLocaleString() ?? "-"}
                </div>
              )}

              <Link href={`/jobs/${job.slug}`} className="apply-btn">
                View Details
              </Link>
            </article>
          ))}
        </div>

        {jobs.length === 0 && <div className="empty-state">No jobs found.</div>}
      </section>
    </main>
  );
}
