# Coding Club Manager
This project is a manager I created for my school's coding club. Features include the ability to register and log-in both admin and student accounts, the ability to schedule meetings (which includes a Zoom link generated via Zoom's API) that can be seen by users on a calendar, the ability to sign students into meetings with a real-time whiteboard display, and notifications for meetings via Sendgrid for email and a Discord bot.

## Setup
After cloning the repo and navigating in the terminal to the root directory of the repo, install all necessary packages with
```shell
yarn
```
or
```shell
npm i
```
Either will work, but I personally recommend using yarn as I used it for the development of the whole project.

You will now need the configure the .env file with the following
```bash
SECRET=<a secure secret key of your choosing>
NODE_ENV=<production or development>
PORT=<port for the backend API, default is 8080>
MONGO_URI=<a connection string to a MongoDB database>
MASTER_PASSWORD=<the master password you will keep that is necessary for registering new Admins>
SENDGRID_API_KEY=<an API key for Sendgrid>
DISCORD_BOT_TOKEN=<a token for your generated Discord Bot>
DISCORD_CHANNEL_ID=<the channel ID of whatever channel you want the Discord bot to message in>
ZOOM_CLIENT_ID=<the public client ID for use with the Zoom API>
ZOOM_CLIENT_SECRET=<the secret key for use with Zoom API>
```

## Usage
#### Development
```bash
yarn dev
```
or
```bash
npm run dev
```
#### Production
```bash
yarn start
```
or
```bash
npm run start
```

### Pages
**/** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; Student home page
**/student/register**&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Registration for students
**/student/login**&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;  Login for students
**/student/profile**     &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;  Profile view/editor for students
**/student/signin** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;Where students go to sign into the current day's meeting

**/admin**&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;Admin home page
**/admin/register**&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;Admin regsistration (requiring the master password)
**/admin/login**&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp; Admin login
**/admin/profile**&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Profile view/editor for admins
**/admin/signin**&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Where admins go to display the code necessary for students to sign-in to the current day's meeting
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;(to be displayed on a smart board and/or screenshared over Zoom)

**/meetings**&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp; Where both students and admins go to see scheduled meetings on the calendar
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; (admins can schedule new meetings)
