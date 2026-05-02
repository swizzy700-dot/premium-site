-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "performanceScore" INTEGER,
    "seoScore" INTEGER,
    "accessibilityScore" INTEGER,
    "bestPracticesScore" INTEGER,
    "overallScore" INTEGER,
    "grade" TEXT,
    "lighthouseData" TEXT,
    "aiInsights" TEXT,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "executionTime" INTEGER,
    "cacheKey" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Audit_cacheKey_key" ON "Audit"("cacheKey");

-- CreateIndex
CREATE INDEX "Audit_url_idx" ON "Audit"("url");

-- CreateIndex
CREATE INDEX "Audit_status_idx" ON "Audit"("status");

-- CreateIndex
CREATE INDEX "Audit_createdAt_idx" ON "Audit"("createdAt");
