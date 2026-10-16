import type { Job } from "./schemas";

// Fallback when every live board is unreachable, so the demo never shows an
// empty page. Fictional companies; the UI labels these as sample jobs.
function seed(
  id: string,
  title: string,
  company: string,
  tags: string[],
  description: string,
): Job {
  return {
    id: `sample-${id}`,
    title,
    company,
    location: "Remote",
    url: "https://remotive.com/remote-jobs/software-dev",
    source: "Sample",
    tags,
    description,
    postedAt: null,
  };
}

export const SEED_JOBS: Job[] = [
  seed(
    "ai-eng",
    "AI Engineer, Matching",
    "Northwind AI",
    ["python", "llm", "rag"],
    "Own our resume-to-job matching engine. Build RAG pipelines with LLMs, embeddings and a vector database (pgvector or Pinecone). Python, FastAPI, PostgreSQL. Evaluate ranking quality and ship fast.",
  ),
  seed(
    "fs-ts",
    "Full-Stack Engineer (TypeScript)",
    "Lumen Careers",
    ["typescript", "react", "next.js"],
    "Build product end to end with TypeScript, React, Next.js and Node.js. Deploy on Vercel, GitHub Actions CI/CD, PostgreSQL and Redis. Early-stage startup, high ownership.",
  ),
  seed(
    "backend-go",
    "Backend Engineer",
    "Kestrel Data",
    ["golang", "kafka", "kubernetes"],
    "Design microservices in Golang on Kubernetes. Kafka event streaming, gRPC, Terraform on AWS. Experience with distributed systems.",
  ),
  seed(
    "ml-platform",
    "Machine Learning Engineer",
    "Orbit Health",
    ["pytorch", "ml"],
    "Train and deploy deep learning models with PyTorch. Airflow pipelines, Spark, Docker, AWS SageMaker. NLP experience a plus.",
  ),
  seed(
    "frontend",
    "Senior Frontend Engineer",
    "Pinecrest Studio",
    ["react", "css", "figma"],
    "Craft accessible interfaces in React and TypeScript with Tailwind CSS. Work closely with design in Figma. Testing with Playwright and Vitest.",
  ),
  seed(
    "data-analyst",
    "Data Analyst",
    "Harbor Retail",
    ["sql", "python"],
    "Analyse sales data with SQL and Python (Pandas). Build dashboards and present insights to stakeholders. Data analysis and Agile ways of working.",
  ),
  seed(
    "devops",
    "Platform / DevOps Engineer",
    "Cobalt Cloud",
    ["aws", "terraform", "docker"],
    "Run our platform on AWS with Terraform, Docker and Kubernetes. Own CI/CD (GitHub Actions), observability and Linux fleet security.",
  ),
  seed(
    "mobile",
    "Mobile Engineer (React Native)",
    "Tandem Fitness",
    ["react native", "ios", "android"],
    "Ship our iOS and Android apps with React Native and TypeScript. REST APIs, GraphQL, offline-first sync.",
  ),
];
