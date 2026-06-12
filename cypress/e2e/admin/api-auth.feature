Feature: Admin API Protection
  As the game operator
  I want mystery management endpoints to require the admin secret
  So that anonymous visitors cannot alter or destroy game content

  Scenario: Updating a mystery without the admin secret is rejected
    When I send a mystery update request without the admin secret
    Then the API rejects the request as unauthorized

  Scenario: Deleting a mystery without the admin secret is rejected
    When I send a mystery delete request without the admin secret
    Then the API rejects the request as unauthorized

  Scenario: Reading a single mystery without the admin secret is rejected
    When I send a single mystery read request without the admin secret
    Then the API rejects the request as unauthorized

  Scenario: Uploading a mystery pack with a wrong admin secret is rejected
    When I send a mystery pack upload with a wrong admin secret
    Then the API rejects the request as unauthorized

  Scenario: The public mystery list used by the game stays open
    When I request the public mystery list without the admin secret
    Then the API accepts the request
