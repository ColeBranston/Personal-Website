export interface PersonalInfo {
  name: string;
  phone?: string;
  email: string;
  location: {
    city: string;
    province?: string;
    country: string;
  };
  linkedin?: string;
  portfolio?: string;
  github?: string;
}

export interface Education {
  institution: string;
  degree: string;
  major: string;
  expected_graduation: string;
  awards?: string[];
}

export interface Skills {
  languages?: string[];
  frameworks?: string[];
  databases?: string[];
  cloud?: string[];
  devops?: string[];
  data?: string[];
  soft_skills?: string[];
  [key: string]: string[] | undefined;
}

export interface WorkExperience {
  company: string;
  title: string;
  location: string;
  date_start: string;
  date_end: string;
  employment_type?: string;
  description: string[];
  technologies?: string[];
  /** Any valid CSS color (named, hex, rgb()/hsl()) used to brand this entry on the timeline. */
  primary_color?: string;
}

export interface Project {
  name: string;
  type: string;
  link?: string;
  /** Optional explicit cover image (any URL, including a github.com/.../blob/... link). */
  cover_image?: string;
  description: string;
  features?: string[];
  technologies?: string[];
  metrics?: Record<string, string>;
  images?: string[];
}

export interface SiteConfig {
  personal: PersonalInfo;
  education: Education;
  skills: Skills;
  work_experience: WorkExperience[];
  projects: Project[];
}

export interface CommitFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: string;
}

export interface CommitSummary {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  additions: number;
  deletions: number;
  filesChanged: number;
}

export interface WeeklyActivity {
  weekStart: string;
  total: number;
  days: number[];
}

export interface RepoCommitData {
  repo: string;
  owner: string;
  name: string;
  defaultBranch: string;
  /** Count of commits fetched in detail (capped, not the repo's full history). */
  totalCommits: number;
  /** True total commit count across the repo's entire history on the default branch. */
  totalCommitCount: number;
  /** Approximate net current lines of code (sum of additions/deletions across history). Null if GitHub hasn't computed it yet. */
  totalLines: number | null;
  commits: CommitSummary[];
  weeklyActivity: WeeklyActivity[];
  fetchedAt: string;
  stale?: boolean;
}
