# ---- Build stage ----
# Uses Gradle's own image (has the `gradle` CLI built in) instead of
# relying on the wrapper jar — this repo doesn't ship gradlew's binary
# jar, so this sidesteps needing it inside the container entirely.
FROM gradle:9.6.1-jdk21 AS build
WORKDIR /app
COPY build.gradle settings.gradle gradle.properties ./
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# ---- Run stage ----
# Slim JRE (no JDK, no Gradle) for the actual running container —
# smaller image, smaller attack surface.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Runs as a non-root user — if the JVM or a dependency is ever
# compromised, it isn't running as root inside the container.
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/build/libs/*.jar app.jar
USER app

EXPOSE 8080

# MaxRAMPercentage keeps the JVM heap sized sanely on a small/free-tier
# container (e.g. Render's 512MB free plan) instead of assuming it has
# a full host's worth of memory to work with.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
