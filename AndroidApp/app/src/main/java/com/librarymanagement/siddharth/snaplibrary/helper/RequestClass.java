package com.librarymanagement.siddharth.snaplibrary.helper;

import com.android.volley.Cache;
import com.android.volley.Network;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.BasicNetwork;
import com.android.volley.toolbox.DiskBasedCache;
import com.android.volley.toolbox.HurlStack;

import java.io.File;

/**
 * Created by siddharthdaftari on 11/4/17.
 */

public class RequestClass {

    private static RequestQueue mRequestQueue = null;

    public static void startRequestQueue() {

        if(mRequestQueue==null) {

            // Instantiate the cache
            Cache cache = new DiskBasedCache(new File("Temp"), 1024 * 1024); // 1MB cap

            // Set up the network to use HttpURLConnection as the HTTP client.
            Network network = new BasicNetwork(new HurlStack());

            // Instantiate the RequestQueue with the cache and network.
            mRequestQueue = new RequestQueue(cache, network);
            // Start the queue
            mRequestQueue.start();
        }

    }

    public static RequestQueue getRequestQueue(){
        return mRequestQueue;
    }

    public static void stopRequestQueue(){
        mRequestQueue.stop();
    }
}
