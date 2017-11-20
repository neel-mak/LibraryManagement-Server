package com.librarymanagement.siddharth.snaplibrary.helper;

import android.util.Log;

/**
 * Created by apoorv.mehta on 11/12/17.
 */

public class LogHelper {

    public static boolean isLogEnabled = true;

    public static void logMessage (String Tag,String message)
    {
        if(isLogEnabled)
            Log.i(Tag,message);
    }
}
