describe("Navigation", () => {
  it("should navigate to the home page", () => {
    // Start from the index page
    cy.visit("http://localhost:3000/");

    // Find a link with an href attribute containing "about" and click it
    cy.get('a[href="/"]').first().click();

    // The new url should be localhost:3000
    cy.url().should("eq", "http://localhost:3000/");

    // The new page should contain an h1 with "About"
    cy.get("h1").contains("Welcome to StreamlineCorp");
  });

  it("should navigate to the signin page", () => {
    cy.visit("http://localhost:3000/");
    cy.get('a[href="/signin"]').click();
    cy.url().should("include", "/signin");
    cy.contains("Sign In"); // Adjust to match your signin page content
  });

  it("should navigate to the signup page", () => {
    cy.visit("http://localhost:3000/");
    cy.get('a[href="/signup"]').click();
    cy.url().should("include", "/signup");
    cy.contains("Sign Up"); // Adjust to match your signup page content
  });

  it("should toggle dark and light mode", () => {
    cy.visit("http://localhost:3000/");
    // Open the mode toggle dropdown
    cy.get('[data-testid="mode-toggle"]').click();
    // Click the Dark menu item
    cy.contains("button,div", "Dark").click();
    cy.get("html").should("have.class", "dark"); // or whatever your dark mode class is

    // Open the mode toggle dropdown again
    cy.get('[data-testid="mode-toggle"]').as("btn").click();
    // Click the Light menu item
    cy.contains("button,div", "Light").click();
    cy.get("html").should("not.have.class", "dark");
  });
});
