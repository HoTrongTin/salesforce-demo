// Class AccountController with methods to get Account details
public class AccountController {
  @AuraEnabled(cacheable=true)
  public static List<Account> getAccounts(Map<String, Object> query) {

    try {
      String sql = 'SELECT Id, Name, Owner.Name, Phone, AnnualRevenue, Type, LastModifiedDate FROM Account';
      String whereClause = makeWhereClause(query);
      if (whereClause != '') {
        sql += ' WHERE' + whereClause;
      }

      Decimal recordsPerPage = (Decimal)query.get('recordsPerPage');
      Decimal currentPage = (Decimal)query.get('currentPage');
      sql += ' LIMIT ' + String.valueOf(recordsPerPage.intValue()) + ' OFFSET ' + String.valueOf((currentPage.intValue() - 1) * recordsPerPage.intValue());
      List<Account> accounts = Database.query(sql);
      return accounts;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled(cacheable=true)
  public static Integer getAccountsCount(Map<String, Object> query) {

    try {
      String sql = 'SELECT COUNT() FROM Account';
      String whereClause = makeWhereClause(query);
      if (whereClause != '') {
        sql += ' WHERE' + whereClause;
      }
      Integer accountsCount = Database.countQuery(sql);
      return accountsCount;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled(cacheable=true)
  public static List<User> getAccountOwners() {
    try {
      List<User> accountOwners = [SELECT Id, Name FROM User];
      return accountOwners;
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

  public static String makeWhereClause(Map<String, Object> query) {

    String whereClause = '';
    if (query.get('accountName') != null && query.get('accountName') != '') {
      whereClause += ' Name LIKE \'%' + query.get('accountName') + '%\'';
    }
    if (query.get('accountType') != null && query.get('accountType') != '') {
      if (whereClause != '') {
        whereClause += ' AND';
      }
      whereClause += ' Type = \'' + query.get('accountType') + '\'';
    }

    String annualRevenue = (String)query.get('annualRevenue');
    if (annualRevenue != null && annualRevenue != '0') {
      if (whereClause != '') {
        whereClause += ' AND';
      }
      // Greater than or equal to
      whereClause += ' AnnualRevenue >= ' + query.get('annualRevenue');
    }
    if (query.get('ownerId') != null && query.get('ownerId') != '') {
      if (whereClause != '') {
        whereClause += ' AND';
      }
      whereClause += ' OwnerId = \'' + query.get('ownerId') + '\'';
    }
    return whereClause;
  }
}