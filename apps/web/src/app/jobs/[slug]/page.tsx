async function getJob(slug: string) {
  const res = await fetch(`http://localhost:5000/jobs/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch job");
  }

  return res.json();
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const job = await getJob(slug);

  return (
    <main className="job-detail-page">
      <div className="job-detail-container">
        <div className="job-hero">
          <span className="job-badge">{job.workMode}</span>

          <h1>{job.title}</h1>

          <p className="company-name">
            {job.company?.name}
          </p>

          <div className="job-meta">
            <span>{job.location}</span>
            <span>{job.jobType}</span>
            <span>{job.experienceLevel}</span>
          </div>

          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              className="apply-link"
            >
              Apply Now →
            </a>
          )}
        </div>

        <section className="job-section">
          <h2>Job Description</h2>
          <p>{job.description}</p>
        </section>

        <section className="job-section">
          <h2>Salary</h2>

          <p>
            {job.currency} {job.minSalary?.toLocaleString()} -
            {" "}
            {job.maxSalary?.toLocaleString()}
          </p>
        </section>

        <section className="job-section">
          <h2>Skills</h2>

          <div className="skills-grid">
            {job.skills?.map((skill: any) => (
              <span
                key={skill.id}
                className="skill-tag"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>

        <section className="job-section">
          <h2>Company</h2>

          <p>{job.company?.name}</p>

          <p>
            Verified:
            {" "}
            {job.company?.verified ? "Yes" : "No"}
          </p>
        </section>
      </div>
    </main>
  );
}