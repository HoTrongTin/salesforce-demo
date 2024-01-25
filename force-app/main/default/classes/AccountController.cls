// Class AccountController with methods to get Account details
public class AccountController {
  @AuraEnabled(cacheable=true)
  public static List<Account> getAccounts(){
    try {
      List<Account> accounts = [SELECT Id, Name, Owner.Name, Phone, AnnualRevenue, Type, LastModifiedDate FROM Account];
      return accounts;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled(cacheable=true)
  public static List<String> getAccountTypes() {
    try {
      List<String> accountTypes = new List<String>();
      Schema.DescribeFieldResult fieldResult = Account.Type.getDescribe();
      List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
      for (Schema.PicklistEntry f : ple) {
        accountTypes.add(f.getLabel());
      }
      return accountTypes;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}