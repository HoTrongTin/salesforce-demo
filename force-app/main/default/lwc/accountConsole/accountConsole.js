import { LightningElement, track, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
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
  allAccounts = [];

  searchAccountName = '';
  searchAccountOwner = '';
  @track annualRevenue = 0;
  @track accountType = '';

  @track showAccounts = [];
  @track columns = columns;
  @track currentPage = 1;
  @track totalPages = 1;
  @track ownerOptions = [];
  @track accountTypeOptions = [];
  @track recordsPerPageOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '30', value: 30 }
  ];
  @track recordsPerPage = 10;
  @track disablePrevious = true;
  @track disableNext = false;

  @wire(getAccounts)
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
          AnnualRevenue: record.AnnualRevenue,
          Type: record.Type,
          LastModifiedDate: this.reformatDateTime(record.LastModifiedDate),
        };
      });

      this.ownerOptions = [...new Set(this.allUnfilteredAccounts.map((record) => record.OwnerName))].map((record) => {
        return {
          label: record,
          value: record
        };
      });

      this.showAccountsChangeHandler();
    } else if (error) {
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

  showAccountsChangeHandler() {
    const isSearchByName = this.searchAccountName.length >= 3 || this.searchAccountOwner.length >= 3;
    const isSearchByAnnualRevenue = this.annualRevenue > 0;
    const isSearchByAccountType = this.accountType != '' ? true : false;
    const isSearching = isSearchByName || isSearchByAnnualRevenue || isSearchByAccountType;

    // Reset all accounts to show
    this.allAccounts = this.allUnfilteredAccounts;

    if (isSearchByName) {
      this.allAccounts = this.allAccounts.filter((record) => {
        return record.Name.toLowerCase().includes(this.searchAccountName.toLowerCase()) && record.OwnerName.toLowerCase().includes(this.searchAccountOwner.toLowerCase());
      });
    }

    if (isSearchByAccountType) {
      this.allAccounts = this.allAccounts.filter((record) => {
        return record.Type === this.accountType;
      });
    }

    if (isSearchByAnnualRevenue) {
      this.allAccounts = this.allAccounts.filter((record) => {
        return record.AnnualRevenue >= this.annualRevenue;
      });
    }

    // Sort by Account Name
    if (isSearching) {
      this.allAccounts.sort((a, b) => { return a.Name.localeCompare(b.Name) });
    }

    // Modify No. column to show the correct number
    this.allAccounts = this.allAccounts.map((record, index) => {
      return { ...record, No: index + 1 }
    })

    this.showAccounts = this.allAccounts.slice((this.currentPage - 1) * this.recordsPerPage, this.currentPage * this.recordsPerPage)
    this.totalPages = Math.ceil(this.allAccounts.length / this.recordsPerPage);
    this.disablePrevious = this.currentPage === 1;
    this.disableNext = this.currentPage === this.totalPages;
  }

  handleNameChange(event) {
    this.searchAccountName = event.target.value;
  }

  handleOwnerChange(event) {
    this.searchAccountOwner = event.target.value;
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
    this.showAccountsChangeHandler();
    console.log('*** Handle search with accountName: ', this.searchAccountName, ' and accountOwner: ', this.searchAccountOwner, ' and annualRevenue: ', this.annualRevenue, ' and accountType: ', this.accountType);
  }

  handlePrevious() {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.showAccountsChangeHandler();
    }
  }

  handleNext() {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      this.showAccountsChangeHandler();
    }
  }

  handleRecordsPerPageChange(event) {
    this.recordsPerPage = +event.detail.value;
    this.currentPage = 1;
    this.showAccountsChangeHandler();
  }

  // use lifecycle hook
  connectedCallback() {
    // console.log('******************** ConnectedCallback...');
  }

  get searchResultMessage() {
    return 'Search result for ' + (this.searchAccountName ? 'Account Name: ' + this.searchAccountName : '') + (this.searchAccountOwner ? 'Account Owner: ' + this.searchAccountOwner : '');
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