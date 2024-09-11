const { Bot, InlineKeyboard, session, webhookCallback } = require('grammy');


// Replace 'YOUR_BOT_TOKEN' with your actual bot token
const bot = new Bot(process.env.BOT_API_TOKEN);

const express = require('express');

const app = express();
app.use(express.json());

app.use(webhookCallback(bot, 'express'))

const endpoint = process.env.BOT_ENDPOINT


async function manageWebhook(bot, newWebhookUrl){
    try{
        const webhookInfo = await bot.api.getWebhookInfo();

        if(webhookInfo.url){
            console.log(`Webhook is active`)
            
            if(webhookInfo.url !== newWebhookUrl){
                console.log('Deleting current webhook...')
                await bot.api.deleteWebhook();
                console.log('Webhook has been deleted')
            }else{
                console.log('new webhook url is same as the current one');
                return
            }
            
            
        }else{
            console.log('no webhook is currently active.');
        }

        // now set the new webhook since none is active.
        console.log('Setting a new webhook...');
        await bot.api.setWebhook(newWebhookUrl)
        console.log('new webhook has been set')
    }catch(error){
        console.error('An error occurred when setting the webhook, ', error)
    }
}

manageWebhook(bot, endpoint)

const port = process.env.PORT_NUBER;

app.listen(port, () => {
    console.log(`Bot is running and listening for updates on port -> ${port}`)
})
//

function initial(){
    return {
        user : {
            first_name: '',
            id: undefined,
            last_name: '',
            username: '',
            isPremium: false,
            gender: undefined,
            preference: [],
            preferenceUpdate: function(){
                `Your current preference list: \n ${this.preference || 'not set'}`
            },
            preferenceList: function(ctx){
                let completePreference = ''
                for(i = 0; i < this.preference.length; i++){
                    completePreference += `${i + 1}. ${this.preference[i]} \n`
                }
                return completePreference
            },
            age: undefined,
            visibility: undefined,
            isPremium: false, 
            premiumDays: 0,
            premiumCalculator: function(){
                if((this.premiumDays) >= 62){
                    return '🙃 Sorry, you cannot purchase a premium for more than 62 days in advance'
                }
                return this.premiumDays += 31 // pd for premium days
            },
            premiumText: function(text){ // a special address for premium users
                if(this.isPremium){
                    return text
                }else{
                    return ''
                }
            },
        },
    }
}

bot.api.sendMessage(process.env.MAIN_ADMIN, 'Hosted!' ,{reply_markup: new InlineKeyboard() .text('ok', 'back_main').text('❌ Cancel', 'cancel')})
bot.callbackQuery('cancel', (ctx) => {
    ctx.deleteMessage()
})
bot.use(session({initial}))

bot.start(async (ctx) => {
    ctx.session.user = {
        ...ctx.session.user, // Preserve existing session data
        first_name: ctx.from.first_name,
        id: ctx.from.id,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
    };
});

// Main menu
const mainMenu = new InlineKeyboard()
.row()
.text(`👤 View Profile`, 'view_profile')
.text(`⚙ Settings`, 'settings')
.row()
.text('🌟👤 Buy Premium 🌟', 'set_premium')
// ! Settings menu
const settingsMenu = new InlineKeyboard()
.row()
.text(`🔆Set Preference`, 'set_preference')
.text(`🔆Set Gender`, 'set_gender')
.row()
.text(`🔆Set Age`, 'set_age')
.text(`🔆Visibility`, 'set_visibility')
.row()
.text(`⬅️Back`, 'back_main');

// Preferences menu
const preferenceMenu = new InlineKeyboard()
.row()
    .text('🏏 Cricket', 'set_cricket')
    .text('⚽ Football', 'set_football')
.row()
    .text('🏀 Basketball', 'set_basketball')
    .text('🏃 Athlete', 'set_athlete')
.row()
    .text('⛳️ Golf', 'set_golf')
    .text('🎱 8Ball', 'set_8ball')
.row()
    .text('🏓 Table Tennis', 'set_table_tennis')
    .text('🎾 Long Tennis', 'set_long_tennis')
.row()
    .text('🏉 Rugby', 'set_rugby')
    .text('⚾️ Baseball', 'set_baseball')
.row()
    .text('⬅️Back', 'settings');

// Gender menu
const genderMenu = new InlineKeyboard()
.text('👨‍🦱 Male', 'set_male')
.text('👩 Female', 'set_female')
.row()
.text('⬅️ Back', 'settings');

// Home only menu
const home = new InlineKeyboard()
    .text('🏠 Home', 'back_main')

//

// Setting visiblity menu
const visibilityMenu = new InlineKeyboard()
.row()
    .text('On', 'visibility_on')
    .text('Off', 'visibility_off')
.row()
    .text('⬅️ Back', 'settings')
        
//


// Start command
bot.command('start', async (ctx) => {
    ctx.reply('🔥Welcome to the home of sports!⛳️🏀🎱🏸🤾🏽‍♂️🎾🏓🏐🏄‍♂️🏑🥍💪🏃‍♂️ \n Where every sportman belongs. Click settings to set up your profile', {
        reply_markup: mainMenu
    });
    console.log(ctx.from)
})
    
// Handle main menu actions
bot.callbackQuery('view_profile', (ctx) => {
    let {user} = ctx.session
    const profileText = `
        👤 Profile Information:
        🌟 Username: ${ctx.from.username || 'Not set'}
        🌟 First Name: ${ctx.from.first_name|| 'Not set'}
        🌟 Age: ${user.age || 'Not set'}
        🌟 Preference: ${user.preference || 'Not set'}
        🌟 Gender: ${user.gender || 'Not set'}
        🌟 Visibility: ${user.visibility || 'Not set'}
        🌟 Premium: ${user.isPremium || 'No'}
        ${user.premiumText(`🌟 Premium days left: ${user.premiumDays}`)}
    `;
    ctx.editMessageText(profileText, {
        reply_markup: backbutton = new InlineKeyboard()
        .text('⬅️ back','back_main')
    });
});


// ! USER PREMIUM
// premium options
const premiumMenu = new InlineKeyboard()
.text('✅ Proceed', 'proceed_premium')
.row()
.text('❌ Cancel', 'back_main')
.text('🏠 Home', 'back_main')

bot.callbackQuery('set_premium', (ctx) => {
    if(ctx.session.user.isPremium){
        ctx.editMessageText('🔆 You are already a premium user. 🔆 \n Would you like to buy more premium?', {reply_markup: premiumMenu})
    }else{
        ctx.editMessageText('🔥 Would you like to purchace a premuim?', {reply_markup: premiumMenu})
    }
})

// when the user buys a premium
bot.callbackQuery('proceed_premium', (ctx) => {
    let user = ctx.session.user

    if(user.premiumDays >= 63 || (user.premiumDays + 31) >= 63){
        ctx.editMessageText('🙃 Sorry, you can\'t purchase a premium for more than 62 days in advance.', {reply_markup: home})
        ctx.answerCallbackQuery('You already premium, Enjoy')
        return
    }else{
        user.isPremium = true;
        user.premiumCalculator(user.premiumDays)
        ctx.editMessageText(`🔥 Congratulations, you are now a premium user.😎 \n Premium days left: ${user.premiumDays}`, {reply_markup: mainMenu})
        ctx.answerCallbackQuery('🔥🔆 You are a premium user for 31 more days. Enjoy your premium experience!')
    }
})

// a special backbutton



bot.callbackQuery('settings', (ctx) => {
    ctx.editMessageText('Choose an option to set:', {
        reply_markup: settingsMenu
    });
});

// ! Handle settings menu actions

bot.callbackQuery('set_preference', (ctx) => {
    let user = ctx.session.user
    if(user.isPremium && (user.preference.length < 4)){
        ctx.editMessageText('Choose your preference:', {
            reply_markup: preferenceMenu
        });
    }else if(user.preference.length < 2){
        ctx.editMessageText('Choose your preference:', {
            reply_markup: preferenceMenu
        });        
    }else{
        ctx.editMessageText(`You have already reached your maximum number of preferences ${user.premiumText('as a premium user')} \nYour Preferences: \n ${user.preferenceList(user.preference)}`, {reply_markup: new InlineKeyboard().text('❌ Reset preference', 'reset_preference').text('🏠 Home', 'back_main')})
    }
});

// Handling preference selection

bot.callbackQuery('reset_preference', (ctx) => {
    ctx.session.user.preference = []
    ctx.editMessageText('You\'r preference has been reset.', {reply_markup: new InlineKeyboard().text('Set preference', 'set_preference').text('Home', 'back_main')})
})


const setPreference = async (ctx, preference) => {
    const user = ctx.session.user
    if(user.isPremium && user.preference.length === 4){
        return ctx.editMessageText(`You have reached your maximum number of preferences. \n Your current preference: \n ${user.preferenceList(user.preference)}`, {reply_markup: home})
    }else if(!user.isPremium && user.preference.length === 2){
        return ctx.editMessageText(`You have reached your maximum number of preferences, upgrade to premium to get more.  \n Your current preference: \n ${user.preferenceList(user.preference)}`, {reply_markup: new InlineKeyboard().text('🌟👤 Buy Premium 🌟', 'set_premium').row().text('🏠 Home', 'back_main')})
    }else{
        user.preference.push(preference);
        ctx.answerCallbackQuery(`🔥 You chose ${preference}!`);
        await ctx.editMessageText(`Preference List \n ${user.preferenceList(user.preference)}`, { reply_markup: preferenceMenu });
    }
};
bot.callbackQuery('set_cricket', (ctx) => setPreference(ctx, 'Cricket'));
bot.callbackQuery('set_golf', async (ctx) => setPreference(ctx, 'Golf'))
bot.callbackQuery('set_football', async (ctx) => setPreference(ctx, 'Football'))
bot.callbackQuery('set_basketball', async (ctx) => setPreference(ctx, 'Basketball'))
bot.callbackQuery('set_athlete', async (ctx) => setPreference(ctx, 'Athlete'))
bot.callbackQuery('set_8ball', (ctx) => setPreference(ctx, '8ball'));
bot.callbackQuery('set_table_tennis', (ctx) => setPreference(ctx, 'Table Tennis'))
bot.callbackQuery('set_long_tennis', (ctx) => setPreference(ctx, 'Long tennis'));
bot.callbackQuery('set_rugby', (ctx) => setPreference(ctx, 'Rugby'));
bot.callbackQuery('set_baseball', (ctx) => setPreference(ctx, 'Baseball'));


// Setting the gender

bot.callbackQuery('set_gender', (ctx) => {
    ctx.editMessageText('Choose your gender:', {
        reply_markup: genderMenu
    });
});

// Handle gender selection
bot.callbackQuery('set_male', (ctx) => {
    ctx.session.user.gender = 'Male';
    ctx.answerCallbackQuery('You chose Male!');
    ctx.editMessageText('Main menu', { reply_markup: mainMenu });
});

bot.callbackQuery('set_female', (ctx) => {
    ctx.session.user.gender = 'Female';
    ctx.answerCallbackQuery('You chose Female!');
    ctx.editMessageText('Main menu', {
        reply_markup: home
    });
});



bot.callbackQuery('set_age', async (ctx) => {
    await ctx.reply('Welcome! Please enter something:');

    // Set a flag on the user session to expect input
    ctx.session.awaitingAge = true;
});

// Middleware to manage state
bot.use(async (ctx, next) => {
    if (ctx.session.awaitingAge && ctx.message?.text) {
        // Store the user input in a variable
        ctx.session.user.age = ctx.message.text;
        
        // Acknowledge the input
        await ctx.reply(`Age updated to: ${ctx.session.user.age}`, {reply_markup: new InlineKeyboard().text('Ok','cancel')});
        ctx.session.awaitingAge = false;
    } else {
        // Continue with other middleware
        await next();
    }
    ctx.session.awaitingAge = false;
});


// ! Visibility settings

bot.callbackQuery('set_visibility', (ctx)=>{
    let visiblityText = `🔆 Global Visibility: ${ctx.session.user.visibility || 'unavailable'} 🔆`;
    ctx.editMessageText(`Turning this on makes you visible to other users.\n When you turn it off, you will not be seen by other users, neither can they see you.\n ${visiblityText} `, {reply_markup: visibilityMenu});
})


// handle visiblity settings
bot.callbackQuery('visibility_on', (ctx) => {
    ctx.session.user.visibility = 'On';
    ctx.answerCallbackQuery('🔥 You are now visible globally');
    ctx.editMessageText(`🔆 Global Visibility: ${ctx.session.user.visibility}  🔆`, {reply_markup: home })

})
bot.callbackQuery('visibility_off', (ctx) => {
    ctx.session.user.visibility = 'Off';
    ctx.answerCallbackQuery('❌ You are now visible globally');
    ctx.editMessageText(`🔆 Global Visibility: ${ctx.session.user.visibility} 🔆`, { reply_markup: home})
})

// Handle back button
bot.callbackQuery('back_main', (ctx) => {
    ctx.editMessageText('Welcome! Please choose an option:', { reply_markup: mainMenu });
});


bot.on(':photo', (ctx) => {
    ctx.reply('Our current features doesn\'t support this')
})

bot.hears("ping", async (ctx) => {
    await ctx.reply("pong", {
        reply_parameters: {message_id: ctx.msg.message_id}
    })
})



