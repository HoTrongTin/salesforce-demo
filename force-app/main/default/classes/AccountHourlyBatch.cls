global class AccountHourlyBatch implements Database.Batchable<sObject>, Database.AllowsCallouts, Schedulable {

    global Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator('SELECT Name, Type, BillingStreet, BillingCity, BillingState, BillingPostalCode, Phone, Website, ExternalId__c FROM Account');
    }
    global void execute(Database.BatchableContext BC, List<Account> scope) {
        // Call the external endpoint to get new account data
        List<Account> updatedAccounts = callExternalEndpoint();
        
        // Map to store accounts by ExternalId__c
        Map<String, Account> externalIdToAccountMap = new Map<String, Account>();
        for (Account acc : updatedAccounts) {
            externalIdToAccountMap.put(acc.ExternalId__c, acc);
        }

        // Update existing accounts
        List<Account> accountsToUpdate = new List<Account>();
        for (Account existingAccount : scope) {
            if (externalIdToAccountMap.containsKey(existingAccount.ExternalId__c)) {
                Account updatedAccount = externalIdToAccountMap.get(existingAccount.ExternalId__c);
                updateAccountFields(existingAccount, updatedAccount);
                accountsToUpdate.add(existingAccount);
            }
        }

        // Insert new accounts
        List<Account> newAccounts = new List<Account>();
        List<String> updateIds = new List<String>();
        for (Account acc : accountsToUpdate) {
            updateIds.add(acc.ExternalId__c);
        }
        for (String externalId : externalIdToAccountMap.keySet()) {
            if (!updateIds.contains(externalId)) {
                newAccounts.add(externalIdToAccountMap.get(externalId));
            }
        }

        // Add new accounts to the list of accounts to update or insert
        accountsToUpdate.addAll(newAccounts);

        // Update or insert accounts
        if (!accountsToUpdate.isEmpty()) {
            upsert accountsToUpdate ExternalId__c;
        }
    }

    global void finish(Database.BatchableContext BC) {
        // Execute any post-processing logic
    }

    // Callout to the external endpoint to get account data
    private List<Account> callExternalEndpoint() {
        HttpRequest req = new HttpRequest();
        HttpResponse res = new HttpResponse();
        Http http = new Http();
        
        req.setEndpoint('https://8a3dd997-2434-4a68-bfd8-65dee93f5024.mock.pstmn.io/getAccounts');
        req.setMethod('GET');
        
        try {
            res = http.send(req);
            // Parse the response and create a list of Account records
            List<Account> updatedAccounts = parseResponse(res.getBody());
            return updatedAccounts;
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
            return new List<Account>();
        }
    }

    // Parse the JSON response and create a list of Account records
    private List<Account> parseResponse(String responseBody) {
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
    private void updateAccountFields(Account existingAccount, Account updatedAccount) {
        existingAccount.Name = updatedAccount.Name;
        existingAccount.Type = updatedAccount.Type;
        existingAccount.BillingStreet = updatedAccount.BillingStreet;
        existingAccount.BillingCity = updatedAccount.BillingCity;
        existingAccount.BillingState = updatedAccount.BillingState;
        existingAccount.BillingPostalCode = updatedAccount.BillingPostalCode;
        existingAccount.Phone = updatedAccount.Phone;
        existingAccount.Website = updatedAccount.Website;
    }

    // Method required by the Schedulable interface
    global void execute(SchedulableContext sc) {
        System.debug('Scheduled job started...');

        // Instantiate the batch class
        AccountHourlyBatch myBatch = new AccountHourlyBatch();

        // Start the batch execution
        Database.executeBatch(myBatch);
    }
}