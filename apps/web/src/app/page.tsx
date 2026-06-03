const jobSources = [
  { name: "Wellfound", count: 1240, focus: "Startups" },
  { name: "Remote OK", count: 890, focus: "Remote" },
  { name: "Remotive", count: 620, focus: "Remote" },
  { name: "Indeed", count: 4800, focus: "All roles" },
  { name: "Instahyre", count: 740, focus: "India tech" },
  { name: "Glassdoor", count: 2150, focus: "Reviews" },
  { name: "Naukri", count: 3900, focus: "India" },
  { name: "Foundit", count: 1340, focus: "APAC" },
  { name: "Hirect", count: 510, focus: "Direct hiring" },
  { name: "LinkedIn Jobs", count: 5600, focus: "Network" },
  { name: "YC Jobs", count: 460, focus: "YC startups" },
  { name: "We Work Remotely", count: 520, focus: "Remote" },
  { name: "FlexJobs", count: 780, focus: "Flexible" },
  { name: "Himalayas", count: 430, focus: "Remote" },
  { name: "Cutshort", count: 390, focus: "India startups" },
  { name: "Dice", count: 680, focus: "Tech" },
];

const jobs = [
  {
    title: "Senior Full Stack Engineer",
    company: "BrightLoop AI",
    initials: "BL",
    location: "Remote, India",
    workMode: "Remote",
    type: "Full-time",
    level: "Senior",
    salary: "INR 38L - 58L",
    source: "Wellfound",
    match: 94,
    posted: "2h ago",
    applicants: 28,
    skills: ["Next.js", "NestJS", "PostgreSQL", "LLM"],
    summary:
      "Own product surfaces for AI hiring workflows, from candidate discovery to recruiter analytics.",
  },
  {
    title: "Product Designer, Talent Marketplace",
    company: "Northstar Labs",
    initials: "NL",
    location: "Bengaluru",
    workMode: "Hybrid",
    type: "Full-time",
    level: "Mid",
    salary: "INR 24L - 36L",
    source: "Instahyre",
    match: 88,
    posted: "5h ago",
    applicants: 44,
    skills: ["Figma", "Design Systems", "Research"],
    summary:
      "Design candidate-first job discovery, saved searches, and recruiter messaging flows.",
  },
  {
    title: "Remote Backend Engineer",
    company: "Atlas Payroll",
    initials: "AP",
    location: "Remote, Worldwide",
    workMode: "Remote",
    type: "Contract",
    level: "Senior",
    salary: "USD 75 - 110/hr",
    source: "Remote OK",
    match: 86,
    posted: "1d ago",
    applicants: 63,
    skills: ["Node.js", "Queues", "Redis", "Prisma"],
    summary:
      "Build reliable integrations, background processing, and billing workflows for global teams.",
  },
  {
    title: "Growth Marketing Manager",
    company: "HireSignal",
    initials: "HS",
    location: "Mumbai",
    workMode: "On-site",
    type: "Full-time",
    level: "Lead",
    salary: "INR 30L - 45L",
    source: "Naukri",
    match: 81,
    posted: "2d ago",
    applicants: 112,
    skills: ["SEO", "Lifecycle", "Analytics"],
    summary:
      "Scale acquisition loops across job seekers, recruiters, and employer brand campaigns.",
  },
];

const trackedApplications = [
  { company: "Cloudlane", role: "Frontend Engineer", stage: "Interview", date: "Jun 04" },
  { company: "Horizon AI", role: "Founding Engineer", stage: "Applied", date: "Jun 02" },
  { company: "TalentGrid", role: "Product Manager", stage: "Screening", date: "May 31" },
];

const quickFilters = [
  "Remote only",
  "Visa support",
  "Founder-led",
  "No code test",
  "Salary visible",
  "Fast response",
];

const stats = [
  { label: "Live jobs", value: "28.4k" },
  { label: "Fresh today", value: "1,264" },
  { label: "Hiring companies", value: "7,910" },
  { label: "Avg. match", value: "86%" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#171a21]">
      <header className="border-b border-[#dfe4ec] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-3" aria-label="AI Job OS home">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#132238] text-sm font-semibold text-white">
              AJ
            </span>
            <span>
              <span className="block text-base font-semibold">AI Job OS</span>
              <span className="block text-xs text-[#687386]">Job search, tracking, matching</span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#4b5565] md:flex">
            <a href="#jobs" className="text-[#171a21]">
              Jobs
            </a>
            <a href="#sources">Sources</a>
            <a href="#tracker">Tracker</a>
            <a href="#companies">Companies</a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#post-job"
              className="hidden rounded-md border border-[#cfd6e2] px-4 py-2 text-sm font-semibold text-[#253042] sm:inline-flex"
            >
              Post a job
            </a>
            <a
              href="#signin"
              className="rounded-md bg-[#176b5b] px-4 py-2 text-sm font-semibold text-white"
            >
              Sign in
            </a>
          </div>
        </div>
      </header>

      <section className="border-b border-[#dfe4ec] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="grid gap-3 lg:grid-cols-[1.1fr_0.8fr_150px]">
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#253042]">
              Role, skill, or company
              <input
                className="h-12 rounded-lg border border-[#cfd6e2] bg-white px-4 text-base font-medium outline-none ring-[#176b5b]/20 placeholder:text-[#8a94a6] focus:ring-4"
                placeholder="Full stack engineer, product manager, React"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#253042]">
              Location
              <input
                className="h-12 rounded-lg border border-[#cfd6e2] bg-white px-4 text-base font-medium outline-none ring-[#176b5b]/20 placeholder:text-[#8a94a6] focus:ring-4"
                placeholder="Remote, Bengaluru, Mumbai, Delhi NCR"
              />
            </label>
            <button className="mt-auto h-12 rounded-lg bg-[#176b5b] px-5 text-sm font-bold text-white shadow-sm shadow-[#176b5b]/20">
              Search jobs
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                className="rounded-md border border-[#d7deea] bg-[#f8fafc] px-3 py-2 text-sm font-medium text-[#334155]"
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-[#dfe4ec] bg-[#fbfcfe] p-4">
                <div className="text-2xl font-semibold tracking-normal text-[#171a21]">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[#687386]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="space-y-5">
          <section className="rounded-lg border border-[#dfe4ec] bg-white p-4" id="sources">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-normal text-[#687386]">
                Sources
              </h2>
              <span className="text-xs font-semibold text-[#176b5b]">16 active</span>
            </div>
            <div className="mt-4 space-y-3">
              {jobSources.slice(0, 10).map((source) => (
                <label key={source.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-[#bac4d3] accent-[#176b5b]"
                    />
                    <span className="truncate font-medium text-[#253042]">{source.name}</span>
                  </span>
                  <span className="text-xs text-[#687386]">{source.count.toLocaleString()}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#dfe4ec] bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-normal text-[#687386]">
              Filters
            </h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-[#253042]">
                Experience
                <select className="mt-2 h-11 w-full rounded-md border border-[#cfd6e2] bg-white px-3 text-sm">
                  <option>Any level</option>
                  <option>Intern</option>
                  <option>Entry</option>
                  <option>Mid</option>
                  <option>Senior</option>
                  <option>Lead</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#253042]">
                Job type
                <select className="mt-2 h-11 w-full rounded-md border border-[#cfd6e2] bg-white px-3 text-sm">
                  <option>All types</option>
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                  <option>Freelance</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#253042]">
                Minimum salary
                <input
                  className="mt-2 h-11 w-full rounded-md border border-[#cfd6e2] bg-white px-3 text-sm"
                  placeholder="INR 20L"
                />
              </label>
            </div>
          </section>
        </aside>

        <section className="space-y-4" id="jobs">
          <div className="flex flex-col gap-3 rounded-lg border border-[#dfe4ec] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-normal text-[#171a21]">
                Recommended jobs
              </h1>
              <p className="mt-1 text-sm text-[#687386]">
                Ranked by resume fit, freshness, salary visibility, and recruiter activity.
              </p>
            </div>
            <select className="h-10 rounded-md border border-[#cfd6e2] bg-white px-3 text-sm font-medium">
              <option>Best match</option>
              <option>Newest</option>
              <option>Highest salary</option>
              <option>Fewest applicants</option>
            </select>
          </div>

          {jobs.map((job) => (
            <article key={`${job.company}-${job.title}`} className="rounded-lg border border-[#dfe4ec] bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#e9f6f2] text-sm font-bold text-[#176b5b]">
                    {job.initials}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-[#171a21]">{job.title}</h2>
                      <span className="rounded-md bg-[#fff7e6] px-2 py-1 text-xs font-semibold text-[#8a5a00]">
                        {job.match}% match
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#4b5565]">
                      {job.company} · {job.location}
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5b6678]">{job.summary}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                  <button className="rounded-md bg-[#176b5b] px-4 py-2 text-sm font-semibold text-white">
                    Apply
                  </button>
                  <button className="rounded-md border border-[#cfd6e2] px-4 py-2 text-sm font-semibold text-[#253042]">
                    Save
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[job.workMode, job.type, job.level, job.salary, job.source].map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-[#dfe4ec] bg-[#f8fafc] px-2.5 py-1.5 text-xs font-semibold text-[#334155]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-[#edf1f6] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span key={skill} className="text-xs font-semibold text-[#176b5b]">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="text-xs font-medium text-[#687386]">
                  {job.posted} · {job.applicants} applicants
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#dfe4ec] bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-normal text-[#687386]">
              Resume match
            </h2>
            <div className="mt-4 rounded-lg bg-[#132238] p-4 text-white">
              <div className="text-3xl font-semibold">91%</div>
              <p className="mt-2 text-sm leading-6 text-[#d6dee9]">
                Strong fit for full stack, backend, and AI product engineering roles.
              </p>
            </div>
            <button className="mt-3 w-full rounded-md border border-[#cfd6e2] px-4 py-2 text-sm font-semibold text-[#253042]">
              Update resume
            </button>
          </section>

          <section className="rounded-lg border border-[#dfe4ec] bg-white p-4" id="tracker">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-normal text-[#687386]">
                Tracker
              </h2>
              <span className="text-xs font-semibold text-[#176b5b]">3 active</span>
            </div>
            <div className="mt-4 space-y-3">
              {trackedApplications.map((item) => (
                <div key={`${item.company}-${item.role}`} className="border-b border-[#edf1f6] pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-[#253042]">{item.company}</span>
                    <span className="text-xs text-[#687386]">{item.date}</span>
                  </div>
                  <div className="mt-1 text-sm text-[#687386]">{item.role}</div>
                  <div className="mt-2 inline-flex rounded-md bg-[#eef7f4] px-2 py-1 text-xs font-semibold text-[#176b5b]">
                    {item.stage}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#dfe4ec] bg-white p-4" id="companies">
            <h2 className="text-sm font-semibold uppercase tracking-normal text-[#687386]">
              Source mix
            </h2>
            <div className="mt-4 space-y-3">
              {jobSources.slice(10).map((source) => (
                <div key={source.name} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="block font-semibold text-[#253042]">{source.name}</span>
                    <span className="block text-xs text-[#687386]">{source.focus}</span>
                  </span>
                  <span className="font-semibold text-[#171a21]">{source.count}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
