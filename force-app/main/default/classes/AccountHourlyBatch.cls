global class AccountHourlyBatch implements Schedulable {
    global void execute(SchedulableContext sc) {
        System.debug('Scheduled job started...');
        callExternalEndpointAndUpsertAccount();
    }

    // Callout to the external endpoint to get account data
    @future(callout=true)
    public static void callExternalEndpointAndUpsertAccount() {
        HttpRequest req = new HttpRequest();
        HttpResponse res = new HttpResponse();
        Http http = new Http();
        
        req.setEndpoint('https://8a3dd997-2434-4a68-bfd8-65dee93f5024.mock.pstmn.io/getAccounts');
        req.setMethod('GET');
        
        try {
            res = http.send(req);
            // Parse the response and create a list of Account records
            List<Account> updatedAccounts = parseResponse(res.getBody());

            // Map to store accounts by ExternalId__c
            Map<String, Account> externalIdToAccountMap = new Map<String, Account>();
            for (Account acc : updatedAccounts) {
                externalIdToAccountMap.put(acc.ExternalId__c, acc);
            }

            // Loop through external
            List<Account> accountsToUpsert = new List<Account>();
            for (String externalId : externalIdToAccountMap.keySet()) {

                // Query for existing account from the database
                List<Account> existingAccounts = Database.query('SELECT Name, Type, BillingStreet, BillingCity, BillingState, BillingPostalCode, Phone, Website, ExternalId__c FROM Account WHERE ExternalId__c = :externalId');
                if (!existingAccounts.isEmpty()) {
                    // Account exists, update it
                    Account existingAccount = existingAccounts[0];
                    Account updatedAccount = externalIdToAccountMap.get(externalId);

                    // Skip if the account fields are equal
                    Boolean fieldsAreEqual = AccountHelper.fieldsAreEqual(updatedAccount, existingAccount);
                    if (fieldsAreEqual) {
                        continue;
                    }

                    updateAccountFields(existingAccount, updatedAccount);
                    accountsToUpsert.add(existingAccount);
                } else {
                    // Account does not exist, insert it
                    accountsToUpsert.add(externalIdToAccountMap.get(externalId));
                }
            }
            // Update or insert accounts
            if (!accountsToUpsert.isEmpty()) {
                upsert accountsToUpsert ExternalId__c;
            }
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
        }
    }

    // Parse the JSON response and create a list of Account records
    static List<Account> parseResponse(String responseBody) {
        List<Account> accounts = new List<Account>();
        
        List<Object> jsonList = (List<Object>) JSON.deserializeUntyped(responseBody);
        for (Object obj : jsonList) {
            Map<String, Object> accountMap = (Map<String, Object>) obj;
            
            Account acc = new Account(
                Name = String.valueOf(accountMap.get('Name')),
                Type = String.valueOf(accountMap.get('Type')),
                BillingStreet = String.valueOf(accountMap.get('BillingStreet')),
                BillingCity = String.valueOf(accountMap.get('BillingCity')),
                BillingState = String.valueOf(accountMap.get('BillingState')),
                BillingPostalCode = String.valueOf(accountMap.get('BillingPostalCode')),
                Phone = String.valueOf(accountMap.get('Phone')),
                Website = String.valueOf(accountMap.get('Website')),
                ExternalId__c = String.valueOf(accountMap.get('ExternalId'))
            );
            
            accounts.add(acc);
        }
        
        return accounts;
    }

    // Update existing Account fields
    static void updateAccountFields(Account existingAccount, Account updatedAccount) {
        existingAccount.Name = updatedAccount.Name;
        existingAccount.Type = updatedAccount.Type;
        existingAccount.BillingStreet = updatedAccount.BillingStreet;
        existingAccount.BillingCity = updatedAccount.BillingCity;
        existingAccount.BillingState = updatedAccount.BillingState;
        existingAccount.BillingPostalCode = updatedAccount.BillingPostalCode;
        existingAccount.Phone = updatedAccount.Phone;
        existingAccount.Website = updatedAccount.Website;
    }

    global void finish(Database.BatchableContext BC) {
        // Execute any post-processing logic
    }
}