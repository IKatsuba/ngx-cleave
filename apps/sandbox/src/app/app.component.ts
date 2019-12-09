import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'ngx-cleave-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public input = new FormControl('12323123jjjk123');

  ngOnInit(): void {
    this.input.valueChanges.subscribe(console.log);
  }
}
