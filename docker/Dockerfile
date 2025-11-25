FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# copia os arquivos explicitamente da raiz do projeto
COPY ../gradlew ./gradlew
COPY ../gradle ./gradle
COPY ../build.gradle ./build.gradle
COPY ../settings.gradle ./settings.gradle
COPY ../src ./src

RUN chmod +x gradlew
RUN ./gradlew build --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
