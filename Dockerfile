FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Copia arquivos necessários para resolver dependências primeiro
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# Baixa dependências para aproveitar cache do Docker
RUN ./gradlew dependencies --no-daemon || true

# Copia o código após dependências (melhor cache)
COPY src ./src

RUN chmod +x gradlew
RUN ./gradlew clean build --no-daemon -x test

# ===========================
# RUN IMAGE
# ===========================
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
