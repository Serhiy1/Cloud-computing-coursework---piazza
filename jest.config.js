module.exports ={
    preset: "ts-jest",
    testEnvironment : "node",
    testMatch : ["**/**/*test.ts"],
    verbose: true,
    forceExit: true,
    testTimeout  : 50000,
    runner: 'jest-serial-runner'
}