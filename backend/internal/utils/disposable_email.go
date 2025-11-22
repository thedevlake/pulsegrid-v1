package utils

import (
	"strings"
)

var disposableEmailDomains = map[string]bool{
	"10minutemail.com": true,
	"tempmail.com": true,
	"guerrillamail.com": true,
	"mailinator.com": true,
	"throwaway.email": true,
	"temp-mail.org": true,
	"yopmail.com": true,
	"mohmal.com": true,
	"fakeinbox.com": true,
	"getnada.com": true,
	"maildrop.cc": true,
	"mintemail.com": true,
	"mytrashmail.com": true,
	"sharklasers.com": true,
	"spamgourmet.com": true,
	"trashmail.com": true,
	"trashmailer.com": true,
	"getairmail.com": true,
	"33mail.com": true,
	"emailondeck.com": true,
	"fakemailgenerator.com": true,
	"mailcatch.com": true,
	"mailmoat.com": true,
	"meltmail.com": true,
	"mytemp.email": true,
	"nada.email": true,
	"nada.ltd": true,
	"putsmail.com": true,
	"rcpt.at": true,
	"spamhole.com": true,
	"tempail.com": true,
	"tempr.email": true,
	"tmpmail.org": true,
	"tmpmail.net": true,
	"tmpmail.io": true,
	"tmpinbox.com": true,
	"tmail.ws": true,
	"tmailinator.com": true,
	"toss.pm": true,
	"yep.it": true,
	"zoemail.org": true,
}

func IsDisposableEmail(email string) bool {
	parts := strings.Split(strings.ToLower(email), "@")
	if len(parts) != 2 {
		return false
	}
	domain := parts[1]
	return disposableEmailDomains[domain]
}

