plugins {
    java
}

group = "com.romanlarichev.qa"
version = "1.0.0-portfolio"

repositories {
    mavenCentral()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

dependencies {
    implementation("org.seleniumhq.selenium:selenium-java:4.13.0")
    implementation("io.rest-assured:rest-assured:5.4.0")
    implementation("io.qameta.allure:allure-rest-assured:2.24.0")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.17.0")

    testImplementation(platform("org.junit:junit-bom:5.10.2"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testImplementation("org.assertj:assertj-core:3.25.3")
    testImplementation("org.wiremock:wiremock:3.5.4")
    testImplementation("io.qameta.allure:allure-junit5:2.24.0")
}

tasks.test {
    useJUnitPlatform()
    systemProperty("allure.results.directory", layout.buildDirectory.dir("allure-results").get().asFile.absolutePath)
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = false
    }
}
