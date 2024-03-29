import { LightningElement, track, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
import getAccountsCount from '@salesforce/apex/AccountController.getAccountsCount';
import getAccountTypes from '@salesforce/apex/AccountController.getAccountTypes';

const columns = [
  { label: 'No.', fieldName: 'No', type: 'number' },
  { label: 'Account Name', fieldName: 'NameUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
  { label: 'Owner', fieldName: 'OwnerUrl', type: 'url', typeAttributes: { label: { fieldName: 'OwnerName' }, target: '_blank' } },
  { label: 'Phone Number', fieldName: 'Phone', type: 'phone' },
  { label: 'Annual Revenue', fieldName: 'AnnualRevenue', type: 'currency', currencyCode: 'USD' },
  { label: 'Last Modified Date', fieldName: 'LastModifiedDate', type: 'text' }
];

export default class AccountConsole extends LightningElement {
  allUnfilteredAccounts = [];
  @track allAccounts = [];

  searchAccountName = '';
  searchAccountOwnerId = '';
  @track annualRevenue = 0;
  @track accountType = '';

  @track query = {
    recordsPerPage: 10,
    currentPage: 1,
    accountName: '',
    ownerId: '',
    annualRevenue: '0',
    accountType: ''
  }

  @track columns = columns;
  @track currentPage = 1;
  @track totalRecords = 0;
  @track totalPages = 1;
  @track accountTypeOptions = [];
  @track recordsPerPageOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '30', value: 30 }
  ];
  @track recordsPerPage = 10;
  @track disablePrevious = true;
  @track disableNext = false;

  @wire(getAccounts, {
    query: '$query'
  })
  wiredAccounts({ error, data }) {
    if (data) {
      console.log('data 1: ', data);
      this.allUnfilteredAccounts = data.map((record) => {
        return {
          Name: record.Name,
          NameUrl: '/' + record.Id,
          OwnerName: record.Owner.Name,
          OwnerUrl: '/' + record.OwnerId,
          Phone: record.Phone,
          AnnualRevenue: +record.AnnualRevenue,
          Type: record.Type,
          LastModifiedDate: this.reformatDateTime(record.LastModifiedDate),
        };
      });

      this.showAccountsChangeHandler();
    } else if (error) {
      console.error(error);
    }
  }

  @wire(getAccountsCount, {
    query: '$query'
  })
  wiredAccountsCount({ error, data }) {
    if (!error) {
      console.log('data 3: ', data);
      this.totalRecords = data;
      this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
      this.disablePrevious = this.currentPage <= 1;
      this.disableNext = this.currentPage >= this.totalPages;
    } else {
      console.error(error);
    }
  }

  @wire(getAccountTypes)
  wiredAccountTypes({ error, data }) {
    if (data) {
      console.log('data 2: ', data);
      this.accountTypeOptions = data.map((record) => {
        return {
          label: record,
          value: record
        };
      })

      // Add "All" option
      this.accountTypeOptions.unshift({ label: 'All', value: '' });
    } else if (error) {
      console.error(error);
    }
  }

  modifyQuery() {
    this.query = {
      ...this.query,
      recordsPerPage: this.recordsPerPage,
      currentPage: this.currentPage,
      accountName: this.searchAccountName.length >= 3 ? this.searchAccountName : '',
      ownerId: this.searchAccountOwnerId,
      annualRevenue: `${this.annualRevenue}`,
      accountType: this.accountType
    }
  }

  showAccountsChangeHandler() {
    const isSearchByName = this.searchAccountName.length >= 3
    const isSearchByAccountOwner = this.searchAccountOwnerId != '' ? true : false;
    const isSearchByAnnualRevenue = this.annualRevenue > 0;
    const isSearchByAccountType = this.accountType != '' ? true : false;
    const isSearching = isSearchByName || isSearchByAnnualRevenue || isSearchByAccountType || isSearchByAccountOwner;

    // Reset all accounts to show
    this.allAccounts = this.allUnfilteredAccounts;

    // Sort by Account Name
    if (isSearching) {
      this.allAccounts.sort((a, b) => { return a.Name.localeCompare(b.Name) });
    }

    // Modify No. column to show the correct number
    this.allAccounts = this.allAccounts.map((record, index) => {
      return { ...record, No: (this.currentPage - 1) * this.recordsPerPage + index + 1 };
    })

    this.disablePrevious = this.currentPage === 1;
    this.disableNext = this.currentPage === this.totalPages;
  }

  handleNameChange(event) {
    this.searchAccountName = event.target.value;
  }

  handleOwnerChange(event) {
    console.log('event.target.recordId: ', event.detail.recordId);
    this.searchAccountOwnerId = event.detail.recordId;
  }

  handleAccountTypeChange(event) {
    this.accountType = event.target.value;
  }

  handleAnnualRevenueChange(event) {
    this.annualRevenue = event.target.value;
  }

  handleSearch() {
    // Check if form valid 
    if (!this.template.querySelector('form').reportValidity()) {
      return;
    }

    this.currentPage = 1;
    this.modifyQuery();
    this.showAccountsChangeHandler();
    console.log('*** Handle search with accountName: ', this.searchAccountName, ' and accountOwner: ', this.searchAccountOwnerId, ' and annualRevenue: ', this.annualRevenue, ' and accountType: ', this.accountType);
  }

  handlePrevious() {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.modifyQuery();
      this.showAccountsChangeHandler();
    }
  }

  handleNext() {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      this.modifyQuery();
      this.showAccountsChangeHandler();
    }
  }

  handleRecordsPerPageChange(event) {
    this.recordsPerPage = +event.detail.value;
    this.currentPage = 1;

    this.modifyQuery();
    this.showAccountsChangeHandler();
  }

  // use lifecycle hook
  connectedCallback() {
    // console.log('******************** ConnectedCallback...');
  }

  // Datetime to delta string, eg: 2020-01-01T00:00:00.000Z to 1 day ago
  reformatDateTime(dateTime) {
    const date = new Date(dateTime);
    const now = new Date();
    const delta = Math.abs(now - date) / 1000;
    const days = Math.floor(delta / 86400);
    const hours = Math.floor(delta / 3600) % 24;
    const minutes = Math.floor(delta / 60) % 60;
    const seconds = Math.floor(delta % 60);
    let output = '';
    if (days > 0) {
      output = days + ' days ago';
    } else if (hours > 0) {
      output = hours + ' hours ago';
    } else if (minutes > 0) {
      output = minutes + ' minutes ago';
    } else {
      output = seconds + ' seconds ago';
    }
    return output;
  }
}