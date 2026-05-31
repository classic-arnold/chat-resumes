# AWS CDK Infra Template

This is a reusable TypeScript CDK v2 template for the EC2 delivery path used in Product Factory:

GitHub push -> CodePipeline -> CodeBuild -> ECR -> CodeDeploy -> EC2 Auto Scaling Group behind an ALB.

For ChatResumes, the current backend scaffold lives in `config/chat-resumes.json` and builds from the repo-root `Dockerfile`.

## Manual Work

- Start from `config/chat-resumes.json` and replace the placeholder GitHub owner, branch, connection ARN, and any account or region values that differ from your target deployment.
- Bootstrap the target AWS account and region for CDK once with an admin-capable principal before synth or deploy. After bootstrap, routine deploys should run as a principal that can read `/cdk-bootstrap/hnb659fds/version` from SSM and assume the `cdk-hnb659fds-*` roles in the target account.
- Create and authorize the CodeStar connection in AWS, then place its ARN in config.
- The ChatResumes path expects the repo-root `Dockerfile` plus the CodeDeploy `appspec.yml` and deployment hook scripts in `infra/deploy/`. The stack generates the CodeBuild buildspec inline.
- Copy `runtime.env.example` to `runtime.env`, fill in the real deployed backend values, and keep that seed file out of git.
- Replace or rotate any generated runtime secrets before production use.
- If you enable SSH on public instances, supply an existing EC2 key pair name in config.
- If you enable imported/shared resources, the hosted zone, certificate, and shared bucket must already exist.

## What It Provisions

- VPC with public, app, and isolated data subnets
- Internet-facing ALB, launch template, and EC2 Auto Scaling Group
- ECR repository, CodeBuild project, CodePipeline, and CodeDeploy deployment group
- Optional Route 53 alias record and ACM certificate wiring
- Optional S3 app bucket, runtime secrets, and SSM parameters
- Optional RDS Postgres, DocumentDB, ElastiCache serverless, or ElastiCache replication group
- Basic CloudWatch alarms and a DLM instance snapshot policy

## Quick Start

```bash
npm install
npm run build
CDK_CONFIG_PATH=config/chat-resumes.json npm run synth
CDK_CONFIG_PATH=config/chat-resumes.json npm run sync-runtime:dry-run -- --seed runtime.env
```

## Runtime Config Flow

- Deployed runtime config lives in one place: SSM Parameter Store under the product stage prefix.
- `runtime.env` remains the operator-managed seed file for deployed backend values. For ChatResumes it currently seeds `NODE_ENV`, `CLIENT_ORIGIN`, `APP_BASE_URL`, `DATABASE_URL`, `SOCKET_PATH`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, and `OPENAI_API_KEY`.
- `sync-runtime` mirrors `OPENAI_API_KEY` from the product root `.env` when present and canonical.
- `CDK_CONFIG_PATH=config/chat-resumes.json npm run sync-runtime -- --seed runtime.env` writes the current seed values to SSM as `String` and `SecureString` parameters under `/products/chat-resumes/mvp/runtime/backend/`.
- `sync-runtime` fails fast if any resolved runtime value still looks like a placeholder such as `replace-me` or an `.example` host, or if a mirrored key in `runtime.env` diverges from the canonical value in the product root `.env`.
- The CodeDeploy `after_install.sh` hook rebuilds `/home/ec2-user/app/.env` from that SSM prefix on every deploy, so EC2 no longer depends on a manually managed host env file.

## Deploy Flow

- After the initial ChatResumes stack exists and `runtime.env` contains a real `DATABASE_URL`, you can use `npm run deploy` to run infra deploy, sync runtime, and start the pipeline in one step.
- For the first rollout, prefer the explicit sequence below so you can populate `DATABASE_URL` from the newly created RDS instance before the first app deploy:

```bash
CDK_CONFIG_PATH=config/chat-resumes.json npm run deploy:infra
CDK_CONFIG_PATH=config/chat-resumes.json npm run sync-runtime -- --seed runtime.env
CDK_CONFIG_PATH=config/chat-resumes.json npm run start-pipeline
```

- The pipeline start helper skips the manual trigger when a pipeline execution is already in progress, which avoids duplicate rollouts after pipeline-definition updates.

Default entrypoint:

- `bin/app.ts`

Default config:

- `config/app.json`

ChatResumes config:

- `config/chat-resumes.json`

Example configs:

- `config/examples/validation-tool.json`
- `config/examples/mvp.json`
- `config/examples/growth.json`

## Config Notes

- `validation-tool`, `mvp`, and `growth` stage presets set sane defaults for instance size, capacity, and backup retention.
- `network.instanceSubnetType` controls whether app instances are placed in private or public subnets.
- `deployment.codedeploy.deploymentMode` accepts `blue-green-placeholder`, but v1 still deploys with the in-place EC2 CodeDeploy path.
- `deployment.build.buildSpecPath` is used as the deploy-bundle anchor for `appspec.yml` and hook scripts. It no longer requires a committed repo-level buildspec file.
- The generated CodePipeline uses V2 Git file-path triggers. The ChatResumes config overrides that path filter so backend deploys react to `Dockerfile`, `package.json`, `yarn.lock`, `backend/**`, `infra/**`, and `web/package.json` changes.
- `storage.appBucketMode` supports `none`, `shared`, or `dedicated`.
- `data.datastore` and `data.cache` are fully optional and default to `none`.

## Intentionally Deferred

- True EC2 blue/green deployment orchestration
- Importing and adopting existing VPC, ALB, ASG, or pipeline resources
- WAF, CloudFront, private service networking, and hardened edge controls
- Full alarm routing, dashboards, and on-call notification wiring
- Advanced data migration and zero-downtime cutover workflows

## Important Notes

- The sample config uses placeholder account values, so `npm run synth` will fail until you point the config at a real, bootstrapped target account.
- After bootstrap, the deploy principal should have at least `ssm:GetParameter` on `arn:aws:ssm:<region>:<account>:parameter/cdk-bootstrap/hnb659fds/version` and `sts:AssumeRole` on `arn:aws:iam::<account>:role/cdk-hnb659fds-*`.
- `desiredCapacity` is intentionally config-driven in this template. That keeps the first deployment predictable, but later CDK deploys will continue to enforce that configured size.
- The template generates the CodeBuild buildspec inline and packages CodeDeploy artifacts from the configured deploy bundle at runtime.
- Basic CloudWatch alarms are provisioned for monitoring, but they are intentionally not attached to CodeDeploy as deployment-stopping alarms. Initial and recovery deployments should fail on real rollout health, not pre-existing ALB alarm state.