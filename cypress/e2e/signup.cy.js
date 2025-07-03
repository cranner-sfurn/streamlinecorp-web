describe("Signup Page", () => {
  it("should allow a user to sign up and redirect to dashboard", () => {
    const timestamp = Date.now();
    const testEmail = `testuser_${timestamp}@example.com`;
    const testPassword = "TestPassword123!";
    const firstName = "Test";
    const surname = "User";

    cy.visit("http://localhost:3000/signup");

    cy.get('input[type="text"]').eq(0).type(firstName); // First Name
    cy.get('input[type="text"]').eq(1).type(surname); // Surname
    cy.get('input[type="email"]').type(testEmail); // Email
    cy.get('input[type="password"]').type(testPassword); // Password

    cy.get('button[type="submit"]').click();

    // Should redirect to home page and show username in nav
    cy.url({ timeout: 10000 }).should("eq", "http://localhost:3000/");
    cy.get("nav").contains(firstName, { timeout: 10000, matchCase: false });
  });
});
