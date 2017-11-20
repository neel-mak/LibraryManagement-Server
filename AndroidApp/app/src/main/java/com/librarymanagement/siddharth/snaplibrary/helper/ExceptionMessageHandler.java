package com.librarymanagement.siddharth.snaplibrary.helper;

import android.content.Context;
import android.support.v7.app.AlertDialog;
import android.view.WindowManager;
import android.widget.Toast;

import java.util.HashMap;

/**
 * Created by siddharthdaftari on 11/19/17.
 */

public class ExceptionMessageHandler {

    public static Context context = null;

    public static void handleError(Context c, String message, Exception e, HashMap<String, Object> extraParams){
        if(message == null || message.equals(""))
        {
            message = "Oops! Something Went Wrong";
        }
        LogHelper.logMessage("Siddharth","-----> EXCEPTION: " + message + "  -----> context: " + context);
        e.printStackTrace();
        Toast toast = Toast.makeText(context, message, Toast.LENGTH_SHORT);
        toast.show();

    }
}
