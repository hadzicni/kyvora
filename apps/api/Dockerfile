FROM eclipse-temurin:21-jdk AS build

WORKDIR /workspace

COPY VERSION ./VERSION
COPY apps/api/gradlew apps/api/settings.gradle apps/api/build.gradle ./apps/api/
COPY apps/api/gradle ./apps/api/gradle

WORKDIR /workspace/apps/api
RUN chmod +x ./gradlew
RUN ./gradlew --no-daemon dependencies

COPY apps/api/src ./src
RUN ./gradlew --no-daemon bootJar -x test

FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S kyvora && adduser -S -G kyvora kyvora

WORKDIR /app
COPY --from=build /workspace/apps/api/build/libs/*.jar ./kyvora-api.jar

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

USER kyvora

ENTRYPOINT ["java", "-jar", "/app/kyvora-api.jar"]
