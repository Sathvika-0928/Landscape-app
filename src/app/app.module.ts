import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { GojsAngularModule } from 'gojs-angular';
import { HttpClientModule } from '@angular/common/http';
import { PackedLayoutDiagramComponent } from './packed-layout-diagram/packed-layout-diagram.component';

@NgModule({
  imports:      [ BrowserModule, FormsModule, GojsAngularModule, HttpClientModule ],
  declarations: [ AppComponent, HelloComponent, PackedLayoutDiagramComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
